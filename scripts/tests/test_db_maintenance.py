import importlib.util
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'db_maintenance.py'
spec = importlib.util.spec_from_file_location('db_maintenance', p)
module = importlib.util.module_from_spec(spec)
import sys
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class PolicyTests(unittest.TestCase):
    def setUp(self):
        self.policy = module.Policy()
        self.now = datetime(2026, 10, 27, tzinfo=timezone.utc)
        self.old = self.now - timedelta(days=200)
        self.marked = self.now - timedelta(days=40)

    def eligible(self, **changes):
        args = dict(account_type='USER', username='maria', created_at=self.old,
                    last_active_at=self.old, marked_at=self.marked,
                    now=self.now, pressure=True, policy=self.policy)
        args.update(changes)
        return module.may_remove_user(**args)

    def test_guest_cannot_be_deleted(self):
        self.assertFalse(self.eligible(account_type='GUEST', username='guest'))
        self.assertFalse(self.eligible(username='Guest'))

    def test_user_cannot_be_deleted_without_pressure(self):
        self.assertFalse(self.eligible(pressure=False))

    def test_marking_is_required(self):
        self.assertFalse(self.eligible(marked_at=None))
        self.assertFalse(self.eligible(marked_at=self.now - timedelta(days=29)))

    def test_new_user_cannot_be_deleted(self):
        self.assertFalse(self.eligible(created_at=self.now - timedelta(days=10)))

    def test_recently_active_user_cannot_be_deleted(self):
        self.assertFalse(self.eligible(last_active_at=self.now - timedelta(days=1)))

    def test_old_user_after_grace_under_pressure_is_eligible(self):
        self.assertTrue(self.eligible())

    def test_storage_limit_must_be_explicit(self):
        self.assertIsNone(module.parse_limit_bytes(None))
        self.assertIsNone(module.parse_limit_bytes(''))
        self.assertEqual(module.parse_limit_bytes('1073741824'), 1073741824)
        with self.assertRaises(ValueError): module.parse_limit_bytes('banana')
        with self.assertRaises(ValueError): module.parse_limit_bytes('128')

    def test_pressure_starts_at_85_percent(self):
        self.assertFalse(module.under_pressure(849, 1000))
        self.assertTrue(module.under_pressure(850, 1000))
        self.assertFalse(module.under_pressure(999, None))

    def test_guest_is_not_subject_to_pressure_gate(self):
        self.assertEqual(self.policy.guest_tasks_days, 30)
        self.assertEqual(self.policy.guest_projects_days, 45)
        self.assertEqual(self.policy.guest_workspaces_days, 60)

    def test_real_deletion_is_bounded(self):
        self.assertEqual(self.policy.max_users_per_run, 1)
        self.assertEqual(self.policy.user_inactive_days, 180)
        self.assertEqual(self.policy.user_grace_days, 30)


if __name__ == '__main__':
    unittest.main()
