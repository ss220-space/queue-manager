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
    data["ip"] = address
    data["targetServer"] = winget(src, null, "url")

    var/list/headers = new
    headers["Content-Type"] = "Application/Json"

    var/datum/callback/cb = CALLBACK(src, /client/.proc/on_client_authorize)
    world.log << "post: [json_encode(data)]"

    SShttp.create_async_request(
        RUSTG_HTTP_METHOD_POST,
        "[BACKEND_URL]/api/v1/webhooks/lobby_connect",
        json_encode(data),
        headers,
        cb
    )


/client/proc/on_client_authorize(datum/http_response/response)
    world.log << "Response [src] [response.body]"
    var/list/resp = json_decode(response.body)

    if (resp.redirect)
        src << browse({"
            <a id='link' href='[resp.redirect]'>
                LINK
            </a>
            <script type='text/javascript'>
                document.getElementById("link").click();
                window.location="byond://winset?command=.quit"
            </script>
            "},
            "border=0;titlebar=0;size=1x1"
        )
    else 
        src << browse({"
            <script>
                window.location.href = "[FRONTEND_URL]#token=[resp.token]"
            </script>
        "})