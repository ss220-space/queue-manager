/datum/http_system
	/// List of all async HTTP requests in the processing chain
	var/list/datum/http_request/active_async_requests
	/// Variable to define if logging is enabled or not. Disabled by default since we know the requests the server is making. Enable with VV if you need to debug requests
	var/logging_enabled = FALSE
	/// Total requests the SS has processed in a round
	var/total_requests

/datum/http_system/proc/Initialize(start_timeofday)
	rustg_create_async_http_client() // Open the door
	active_async_requests = list()
	return ..()

/datum/http_system/proc/stat_entry()
	..("P: [length(active_async_requests)] | T: [total_requests]")

/datum/http_system/proc/fire(resumed)
	for(var/r in active_async_requests)
		var/datum/http_request/req = r
		// Check if we are complete
		if(req.is_complete())
			// If so, take it out the processing list
			active_async_requests -= req
			var/datum/http_response/res = req.into_response()

			// If the request has a callback, invoke it.Async of course to avoid choking the SS
			if(req.cb)
				req.cb.InvokeAsync(res)

			// And log the result
			if(logging_enabled)
				var/list/log_data = list()
				log_data += "BEGIN ASYNC RESPONSE (ID: [req.id])"
				if(res.errored)
					log_data += "\t ----- RESPONSE ERRROR -----"
					log_data += "\t [res.error]"
				else
					log_data += "\tResponse status code: [res.status_code]"
					log_data += "\tResponse body: [res.body]"
					log_data += "\tResponse headers: [json_encode(res.headers)]"
				log_data += "END ASYNC RESPONSE (ID: [req.id])"
				WRITE_LOG(global.http_log, log_data.Join("\n[global.log_end]"))

/**
  * Async request creator
  *
  * Generates an async request, and adds it to the subsystem's processing list
  * These should be used as they do not lock the entire DD process up as they execute inside their own thread pool inside RUSTG
  */
/datum/http_system/proc/create_async_request(method, url, body = "", list/headers, datum/callback/proc_callback)
	var/datum/http_request/req = new()
	req.prepare(method, url, body, headers)
	if(proc_callback)
		req.cb = proc_callback

	// Begin it and add it to the SS active list
	req.begin_async()
	active_async_requests += req
	total_requests++

	if(logging_enabled)
		// Create a log holder
		var/list/log_data = list()
		log_data += "BEGIN ASYNC REQUEST (ID: [req.id])"
		log_data += "\t[uppertext(req.method)] [req.url]"
		log_data += "\tRequest body: [req.body]"
		log_data += "\tRequest headers: [req.headers]"
		log_data += "END ASYNC REQUEST (ID: [req.id])"

		// Write the log data
		WRITE_LOG(global.http_log, log_data.Join("\n[global.log_end]"))