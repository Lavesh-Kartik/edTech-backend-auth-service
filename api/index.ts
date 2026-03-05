import { createNestApp } from '../src/main';

let appPromise: Promise<any>;

export default async function handler(req: any, res: any) {
  if (!appPromise) {
    appPromise = createNestApp().then(async (app) => {
        await app.init();
        return app;
    });
  }
  
  const app = await appPromise;
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}
