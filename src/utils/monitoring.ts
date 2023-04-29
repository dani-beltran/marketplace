type MonitoringParams = {
  startTime: number;
  statusCode: number;
  req: {url?: string, method?: string};
}

/**
 * Function to monitor endpoints.
 * @param startTime The start time of the request in ms
 * @param endTime The end time of the request in ms
 * @param status The status code of the response
 */
export const monitor = ({startTime, req, statusCode}: MonitoringParams) => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  // TODO: Send the data to a monitoring service like DataDog or New Relic
  console.info(`${req.method} ${req.url} responded ${statusCode} and took ${duration}ms`);
}