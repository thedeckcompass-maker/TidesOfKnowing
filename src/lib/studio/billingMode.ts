/** Live execution requires a separate, explicit deployment release setting. Defaults remain off. */
export const BILLING_RELEASE='2026-10-31-standard-v2';
export type BillingMode={testMode:boolean;productionRelease?:string};
export function billingModeEnabled(config:BillingMode){return config.testMode===true||(config.testMode===false&&config.productionRelease===BILLING_RELEASE);}
export function stripeModeMismatch(config:BillingMode,value:{livemode?:boolean}){return !billingModeEnabled(config)||typeof value.livemode!=='boolean'||value.livemode!==!config.testMode;}
