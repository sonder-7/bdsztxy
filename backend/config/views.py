from django.http import JsonResponse


def health(request):
    return JsonResponse(
        {
            "name": "表达实战特训营管理系统 API",
            "status": "ok",
            "endpoints": {
                "admin": "/admin/",
                "login": "/api/auth/login/",
                "me": "/api/auth/me/",
            },
            "frontend": "http://127.0.0.1:5173/",
        },
        json_dumps_params={"ensure_ascii": False, "indent": 2},
    )
