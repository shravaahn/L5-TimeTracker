// This function receives time entries from the front-end and saves them to ClickUp.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;
    const { timeEntries, teamId } = request.body;

    if (!timeEntries || timeEntries.length === 0) {
      return response.status(200).json({ message: 'No time entries to save.' });
    }

    // ClickUp's API wants us to send requests one by one.
    // We'll use Promise.all to run them in parallel for speed.
    const promises = timeEntries.map(entry => {
      const { taskId, date, hours, userId } = entry;
      
      // Convert hours to milliseconds for the API
      const durationMs = hours * 60 * 60 * 1000;
      
      // Set a default start time for the entry (e.g., 9 AM on that day)
      const startDate = new Date(date);
      startDate.setHours(9, 0, 0, 0);
      const startMs = startDate.getTime();

      const body = {
        start: startMs,
        duration: durationMs,
        tid: taskId,
        assignee: userId
      };

      return fetch(`https://api.clickup.com/api/v2/team/${teamId}/time_entries`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    });

    const results = await Promise.all(promises);

    // Check if any of the requests failed
    const failedRequests = results.filter(res => !res.ok);
    if (failedRequests.length > 0) {
      throw new Error(`${failedRequests.length} of ${results.length} time entries failed to save.`);
    }

    response.status(200).json({ message: 'All time entries saved successfully!' });

  } catch (error) {
    console.error('SERVER-SIDE SAVE ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}