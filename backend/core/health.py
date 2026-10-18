import logging

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET


logger = logging.getLogger(__name__)

# Function to monitoring the disponibility of the app with "betterStack"
@require_GET
@never_cache
def health_check(request):
    """Return service health for external uptime monitors."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        logger.exception("Health check failed: database is unavailable")
        return JsonResponse(
            {"status": "unhealthy", "checks": {"database": "unavailable"}},
            status=503,
        )

    return JsonResponse({"status": "ok", "checks": {"database": "ok"}})
