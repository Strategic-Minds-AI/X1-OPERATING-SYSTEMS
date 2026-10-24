import { createRemoteJWKSet, jwtVerify } from "jose";
import { OAuthError, OAuthErrorCode, type OAuthConfig, type AuthInfo } from "skybridge/server";

const supabase="https://uvdkzsbjackpjvpoxtyk.supabase.co";
const issuer=supabase+"/auth/v1";
const jwks=createRemoteJWKSet(new URL(issuer+"/.well-known/jwks.json"));
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Claims={sub:string,tenantId:string,clientId:string};
export function stagingOAuth():OAuthConfig<Claims>|undefined{
 if(process.env.NODE_ENV!=="production")return undefined;
 const key=process.env.X1_SUPABASE_PUBLISHABLE_KEY;
 const tenant=process.env.X1_ALLOWED_TENANT_ID;
 const baseUrl=process.env.X1_MCP_SERVER_URL;
 if(process.env.X1_STAGING_ONLY!=="true"||!key||!tenant||!uuid.test(tenant)||!baseUrl||!/^https:\/\//.test(baseUrl)){
  throw new Error("X1_AUTH_CONFIGURATION_REQUIRED: staging/tenant/publishable-key/HTTPS resource URL");
 }
 return {
  baseUrl,
  oauthMetadata:{
   issuer,authorization_endpoint:issuer+"/oauth/authorize",
   token_endpoint:issuer+"/oauth/token",
   response_types_supported:["code"],
   grant_types_supported:["authorization_code","refresh_token"],
   code_challenge_methods_supported:["S256"],
   scopes_supported:["openid","email","profile"]
  },
  requiredScopes:["openid"],
  verifier:{
   verifyAccessToken:async(token:string):Promise<AuthInfo<Claims>>=>{
    const {payload}=await jwtVerify(token,jwks,{issuer,audience:"authenticated",algorithms:["ES256","RS256"],clockTolerance:30}).catch(()=>{throw new OAuthError(OAuthErrorCode.InvalidToken,"Invalid or expired access token")});
    const sub=payload.sub, clientId=payload.client_id;
    if(typeof sub!=="string"||!uuid.test(sub)||typeof clientId!=="string"||!clientId||payload.role!=="authenticated"){
     throw new OAuthError(OAuthErrorCode.InvalidToken,"Invalid OAuth subject or client");
    }
    if(typeof payload.scope!=="string"||!payload.scope.split(" ").includes("openid"))throw new OAuthError(OAuthErrorCode.InsufficientScope,"openid scope required");
    const membershipUrl=supabase+"/rest/v1/x1_tenant_memberships?select=tenant_id,role&user_id=eq."+encodeURIComponent(sub)+"&tenant_id=eq."+encodeURIComponent(tenant)+"&status=eq.ACTIVE&limit=2";
    const response=await fetch(membershipUrl,{headers:{apikey:key,Authorization:"Bearer "+token,Accept:"application/json"},signal:AbortSignal.timeout(4500)});
    if(!response.ok)throw new OAuthError(OAuthErrorCode.TemporarilyUnavailable,"Tenant membership lookup unavailable");
    const rows=await response.json();
    if(!Array.isArray(rows)||rows.length!==1||!["OWNER","ADMIN","BUILDER","VALIDATOR"].includes(String(rows[0].role)))throw new OAuthError(OAuthErrorCode.AccessDenied,"Tenant access denied");
    return {token,clientId,scopes:payload.scope.split(" "),expiresAt:payload.exp,extra:{sub,clientId,tenantId:tenant}};
   }
  }
 };
}
