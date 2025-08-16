// This is a Vercel serverless function that runs in Node.js
// Its job is to securely exchange the temporary 'code' for a permanent 'access_token'

export default async function handler(request, response) {
  try {
    // Get the 'code' that the front-end sent to us
    const { code } = request.body;

    // Get our secret credentials from Vercel's environment variables
    const CLIENT_ID = process.env.CLICKUP_CLIENT_ID;
    const CLIENT_SECRET = process.env.CLICKUP_CLIENT_SECRET;

    // Prepare the request to ClickUp's API
    const query = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
    }).toString();

    // Make the secure server-to-server request to trade the code for a token
    const apiResponse = await fetch(
      `https://api.clickup.com/api/v2/oauth/token?${query}`,
      { method: 'POST' }
    );

    // Check if the request was successful
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('ClickUp API Error:', errorText);
      return response.status(apiResponse.status).json({ error: `ClickUp API Error: ${errorText}` });
    }

    // Get the access token from the response
    const data = await apiResponse.json();
    const accessToken = data.access_token;

    // Send the access token back to our front-end
    response.status(200).json({ accessToken: accessToken });

  } catch (error) {
    console.error('Internal Server Error:', error);
    response.status(500).json({ error: 'Something went wrong.' });
  }
}