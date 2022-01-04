var/global/http_log = "data/logs/http.log"
var/global/log_end = ""
var/global/datum/http_system/SShttp

/world
    name = WORLD_NAME

/world/New()
    . = ..()
    SShttp = new
    SShttp.Initialize()
    while (TRUE) 
        SShttp.fire()
        sleep(1)
    

/client/New()
    . = ..()

    var/list/data = new
    data["ckey"] = ckey

    var/list/headers = new
    headers["Content-Type"] = "Application/Json"

    var/datum/callback/cb = CALLBACK(src, /client/.proc/on_client_authorize)
    world.log << "post: [json_encode(data)]"

    SShttp.create_async_request(
        RUSTG_HTTP_METHOD_POST,
        "[BACKEND_URL]/api/v1/auth/authorize",
        json_encode(data),
        headers,
        cb
    )


/client/proc/on_client_authorize(datum/http_response/response)
    world.log << "Response [src] [response.body]"

    src << browse({"
        <script>
            window.location.href = "[FRONTEND_URL]#token=[response.body]"
        </script>
    "})