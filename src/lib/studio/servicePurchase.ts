import {STANDARD_OFFERS} from './serviceOffers';
export function servicePurchase(offer:string|null,billing:string|null){
 if(!offer||!['create','collaborate','develop'].includes(offer))return null;
 const item=STANDARD_OFFERS[offer as 'create'|'collaborate'|'develop'];
 const choices=offer==='create'?['monthly','annual']:['once','instalments'];
 if(!billing||!choices.includes(billing))return null;
 const terms=offer==='create'?(billing==='monthly'?'US$12 per month':'US$120 per year'):billing==='once'?`US$${('price' in item?item.price:0).toLocaleString('en-US')} in one payment`:`${'payments' in item?item.payments:0} monthly payments of US$${'instalment' in item?item.instalment:0} — US$${('total' in item?item.total:0).toLocaleString('en-US')} total`;
 return {offer,billing,name:item.name,terms};
}
