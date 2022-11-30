/**
 * A list of OpenSky Network credentials. Requests will try these credentials one by one to circumvent rate limit
 * restrictions.
 */
const USERS: { username: string; password: string }[] = [
  {username: "wl353", password: "aby!jrw@xjm3hut2RCY"},
  {username: "zw427", password: "e@knN8NxEmx4t5s"},
];

/**
 * Make a request to the OpenSky Network API.
 *
 * @param uri The URI, such as "/states/all".
 * @param params Parameters for the request.
 * @param user For internal use. Use default value of 0.
 */
export default async function makeReq<T = any>
(uri: string, params: { [name: string]: any } = {}, user = 0): Promise<T | null> {
  // Remove "/" at the beginning of URI if exists.
  if (uri.startsWith("/")) uri = uri.substring(1);

  // If user is 0, use anonymous; otherwise, use USERS[user - 1].
  const headers = user === 0 ? undefined : new Headers({
    "Authorization": "Basic " + btoa(`${USERS[user - 1].username}:${USERS[user - 1].password}`),
  });

  // Convert parameters to URL query.
  const paramsQuery = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const res = await fetch(`https://opensky-network.org/api/${uri}?${paramsQuery}`, {headers});

  // 429 is rate limit exceeded.
  if (res.status == 429) {
    if (user < USERS.length) {
      return await makeReq<T>(uri, params, user + 1);
    } else {
      console.error(`A request to URI ${uri} has been rejected due to rate limit.`);
      return null;
    }

    // 400+ is error.
  } else if (res.status >= 400) {
    const body = await res.text();
    console.error(
      `A request to URI ${uri} has been failed.\n` +
      `Status code: ${res.status}\n` +
      "Response body:\n" + body
    );
    return null;

  } else {
    return await res.json();
  }
}
