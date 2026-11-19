/** Display only: the existing service provider remains the authority for every request. */
export function serviceAllowancePresentation(total:number,items:{status:string}[],completedStatus:string,released:number,active:boolean){
 const completed=items.filter(item=>item.status===completedStatus).length;
 const pending=items.length-completed;
 return {included:total,completed,pending,requestable:active?Math.max(0,released-items.length):0};
}
