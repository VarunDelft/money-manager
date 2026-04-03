import serverlessExpress from '@codegenie/serverless-express';
import { createApp } from './api/index';

let serverlessExpressInstance: ReturnType<typeof serverlessExpress>;

function getServerlessExpress(): ReturnType<typeof serverlessExpress> {
  if (!serverlessExpressInstance) {
    const app = createApp();
    serverlessExpressInstance = serverlessExpress({ app });
  }
  return serverlessExpressInstance;
}

export const handler = (
  event: Record<string, unknown>,
  context: Record<string, unknown>,
  callback: (...args: unknown[]) => void,
): void => {
  getServerlessExpress()(event, context, callback);
};
