import {handle} from '@astrojs/cloudflare/handler';
import {runStudioBillingSchedule} from './lib/studio/billingScheduler';
export default {
 fetch:handle,
 async scheduled(event:{scheduledTime:number},env:Record<string,unknown>){await runStudioBillingSchedule(env,event.scheduledTime);}
};
