import unittest
from mission_compiler import compile_mission
class CompilerTest(unittest.TestCase):
 def test_stable_identity(self):
  self.assertEqual(compile_mission(" Build  a site ")["mission_id"],compile_mission("Build a site")["mission_id"])
 def test_guardrails(self):
  m=compile_mission("Build an epoxy contractor website",client_id="SYNTHETIC")
  self.assertEqual(len(m["tasks"]),13)
  self.assertEqual(m["guards"]["visual_desktop_required"],10)
  self.assertEqual(m["guards"]["visual_mobile_required"],10)
  self.assertEqual(m["guards"]["logo_concepts_required"],10)
  self.assertEqual(m["guards"]["benchmark_websites_required"],3)
  self.assertEqual(m["guards"]["domain_candidates_required"],50)
  self.assertTrue(m["not_submitted"])
  self.assertEqual(sum(t["approval_required"] for t in m["tasks"]),2)
 def test_empty_input_rejected(self):
  with self.assertRaises(ValueError):compile_mission(" ")
if __name__=="__main__":unittest.main()
