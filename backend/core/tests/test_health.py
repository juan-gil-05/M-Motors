from unittest.mock import patch

from django.test import RequestFactory, TestCase

from core.health import health_check


class HealthCheckTests(TestCase):
    """Check healthy, failed-database, and method-restriction responses."""

    def test_health_check_reports_successful_database_query(self):
        response = health_check(RequestFactory().get("/health/"))
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"status": "ok", "checks": {"database": "ok"}})
        self.assertIn("no-store", response["Cache-Control"])

    def test_health_check_reports_database_failure(self):
        with patch("core.health.connection.cursor", side_effect=RuntimeError("database offline")), patch("core.health.logger.exception"):
            response = health_check(RequestFactory().get("/health/"))
        self.assertEqual(response.status_code, 503)
        self.assertJSONEqual(response.content, {"status": "unhealthy", "checks": {"database": "unavailable"}})

    def test_health_check_rejects_non_get_methods(self):
        response = health_check(RequestFactory().post("/health/"))
        self.assertEqual(response.status_code, 405)

    def test_wsgi_and_asgi_entrypoints_are_available(self):
        from core.asgi import application as asgi_application
        from core.wsgi import application as wsgi_application

        self.assertTrue(callable(asgi_application))
        self.assertTrue(callable(wsgi_application))
