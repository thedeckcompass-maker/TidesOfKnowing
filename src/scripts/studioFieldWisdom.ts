import {fieldWisdom} from '../lib/studio/fieldWisdom';
export function wisdomKey(field:HTMLElement):string{
if(field.closest('[data-exchange-draft]'))return 'exchange.'+(field.getAttribute('name')??'');
if(field.closest('[data-account-desk]'))return 'accountCapture.'+(field.getAttribute('name')??'');
if(field.closest('[data-creator-capture]')&&['text','cardId','sectionId'].includes(field.getAttribute('name')??''))return 'capture.'+field.getAttribute('name');
if((field.getAttribute('name')??'').startsWith('book_'))return 'book.'+field.getAttribute('name')!.slice(5);
if(field.hasAttribute('data-artist-help'))return 'artist.'+field.getAttribute('data-artist-help');
if((field.closest('form')?.getAttribute('action')??'').includes('/api/artists/collaborate')){const name=field.getAttribute('name')??'';if(name.startsWith('portfolio_url_'))return 'artist.portfolioUrl';if(name.startsWith('portfolio_title_'))return 'artist.portfolioTitle';if(name.startsWith('portfolio_description_'))return 'artist.portfolioDescription';return 'artist.'+name;}

if(field.hasAttribute('data-symbol-help'))return 'symbol.'+field.getAttribute('data-symbol-help');
const attrs:Record<string,string>={'data-response':'spark','data-north-star':'northStar','data-foundation-response':'foundation','data-foundation-output':'brief','data-architecture-response':'architecture','data-architecture-output':'blueprint','data-making-field':'making','data-launch-field':'launch','data-media':'media'};
for(const [attr,prefix]of Object.entries(attrs))if(field.hasAttribute(attr)){const key=field.getAttribute(attr)!;if(attr==='data-response'&&['startingPlace','background'].includes(key))return 'utility.'+key;return prefix+'.'+key}
const dataKeys:Record<string,string>={'data-journal-replace':'journal.replacePhoto','data-connection-kind':'connection.kind','data-connection-note':'connection.note','data-question-text':'question.text','data-question-excerpt':'question.excerpt','data-making-proof-notes':'making.proofNotes','data-launch-campaign':'launch.campaignDuration','data-launch-weeks-input':'launch.leadWeeks','data-notes':'visual.notes','data-map-search':'utility.search','data-collection-search':'utility.search','data-relationship-lens':'utility.relationshipLens','data-map-view':'utility.mapView','data-connection-from':'utility.connectionFrom','data-connection-to':'utility.connectionTo','data-source-card':'utility.source_card','data-preset':'utility.sizePreset','data-sample':'utility.sample','data-making-path':'utility.makingPath','data-making-proof-package':'utility.proofPackage','data-making-proof-kind':'utility.proofKind','data-making-proof-decision':'utility.proofDecision','data-launch-audience':'utility.storyAudience'};
for(const [attr,key]of Object.entries(dataKeys))if(field.hasAttribute(attr))return key;
if(field.id==='guidance')return 'utility.guidance';if(field.hasAttribute('data-style'))return 'utility.'+field.getAttribute('data-style');if(field.closest('[data-references]'))return field.closest('label')?.textContent?.toLowerCase().includes('rights')?'reference.rights':'reference.note';
if(field.closest('[data-creative-setup]'))return 'creative.'+field.getAttribute('name');
if(field.hasAttribute('data-outline-label'))return 'outline.name';
if(field.closest('[data-guidebook-outline]')&&field.tagName==='TEXTAREA')return 'outline.writing';
if(field.hasAttribute('data-outline-template'))return 'outline.format';
const name=field.getAttribute('name')??'',form=field.closest('form'),action=form?.getAttribute('action')??'',label=(field.getAttribute('aria-label')??field.closest('label')?.textContent??'').trim().toLowerCase();
if(field.getAttribute('type')==='search'||field.closest('[data-studio-card-search]')||field.closest('.studio-card-search'))return 'utility.search';
if(form?.hasAttribute('data-companion-form'))return ['title','order','body'].includes(name)?'companion.'+name:'utility.section_type';
if(field.closest('[data-card-writing]'))return ['status','family_id'].includes(name)?'utility.'+name:'card.'+name;
if(action.includes('/journal/')||action.endsWith('/journal')){if(name==='title')return 'journal.title';if(name==='body_markdown')return 'journal.body';if(name==='caption')return 'journal.caption';}
if(name==='purpose'&&action.includes('/excerpts'))return 'utility.purpose';if(name==='excerpt_title')return 'excerpt.title';if(name==='excerpt_text')return 'excerpt.text';if(name==='caption')return 'journal.caption';
if(action.includes('/guidebook')||location.pathname.includes('/guidebook/')){if(name==='title')return 'guidebook.title';if(name==='body_markdown')return 'guidebook.body';if(name==='sort_order')return 'guidebook.sort_order'}
if(action.includes('/families'))return 'family.'+name;if(action.includes('/production'))return name==='status'?'utility.status':'production.'+name;
if(name==='current_task'||name==='notes')return 'programme.'+name;
if(['title','card_number','sort_order'].includes(name))return 'card.'+name;
if(name==='username')return 'utility.username';
if(['name','deck_size','purpose','intended_reader','promise','description','next_action','current_risk'].includes(name))return 'project.'+name;
if(['deck_type','pathway','status','family_id','section_type','card_id','entry_kind','linked_card_id','linked_section_id','entry','photo_id'].includes(name))return 'utility.'+name;
if(label.includes('intention / source'))return 'reference.note';if(label.includes('rights / permission'))return 'reference.rights';
return 'UNMAPPED:'+name+':'+label.replace(/\s+/g,' ').slice(0,100);
}
let sequence=0;
export function installFieldWisdom(scope:ParentNode=document){const fields=scope.querySelectorAll<HTMLElement>('textarea,input,select,[contenteditable="true"]');for(const field of fields){if(field.dataset.studioHelp==='none'||field.dataset.studioHelpAttached)continue;const type=field.getAttribute('type')??'text';if(field.tagName==='INPUT'&&['hidden','checkbox','radio','button','submit','color','range','file','reset'].includes(type))continue;
const key=wisdomKey(field),copy=fieldWisdom(key);field.dataset.helpKey=key;if(!copy){field.dataset.helpMissing='true';continue}
let label=field.closest<HTMLLabelElement>('label');if(!label&&field.id)label=[...document.querySelectorAll<HTMLLabelElement>('label[for]')].find(e=>e.htmlFor===field.id)??null;
if(!field.id)field.id='studio-help-field-'+(++sequence);const labelText=(field.getAttribute('aria-label')??label?.querySelector('span')?.textContent??label?.childNodes[0]?.textContent??field.getAttribute('placeholder')??key).trim().replace(/\s+/g,' ');
const wrap=document.createElement('div');wrap.className='studio-field-help-wrap';field.dataset.studioHelpAttached='true';delete field.dataset.helpMissing;const anchor=label??field;anchor.parentNode!.insertBefore(wrap,anchor);const computed=getComputedStyle(anchor);wrap.style.marginTop=computed.marginTop;wrap.style.marginBottom=computed.marginBottom;wrap.style.gridColumn=computed.gridColumn;wrap.style.flex=computed.flex;wrap.append(anchor);(anchor as HTMLElement).style.marginTop='0';(anchor as HTMLElement).style.marginBottom='0';
if(label){label.classList.add('studio-help-label');const heading=document.createElement('span');heading.className='studio-help-label-text';const leading=[...label.childNodes].filter(n=>n!==field&&!(n instanceof HTMLElement&&['INPUT','TEXTAREA','SELECT'].includes(n.tagName)));if(leading.length){label.insertBefore(heading,label.firstChild);for(const n of leading)heading.append(n)}}else{const hiddenLabel=document.createElement('label');hiddenLabel.htmlFor=field.id;hiddenLabel.textContent=labelText;hiddenLabel.className='studio-help-sr-only';wrap.prepend(hiddenLabel)}
const detail=document.createElement('details'),summary=document.createElement('summary'),panel=document.createElement('div'),panelId=field.id+'-wisdom-'+(++sequence);detail.className='studio-field-wisdom';summary.textContent='?';summary.id=panelId+'-trigger';summary.setAttribute('aria-label','Help with '+labelText);summary.setAttribute('aria-controls',panelId);summary.setAttribute('aria-expanded','false');summary.dataset.studioHelpFor=field.id;wrap.dataset.studioHelpFor=field.id;field.setAttribute('aria-details',panelId);panel.id=panelId;panel.className='studio-field-wisdom-panel';panel.setAttribute('role','region');panel.setAttribute('aria-labelledby',summary.id);
for(const [heading,text]of [['Personal',copy.personal],['Practical',copy.practical]]){if(!text)continue;const h=document.createElement('h4'),p=document.createElement('p');h.textContent=heading??'Practical';p.textContent=text;panel.append(h,p)}

detail.append(summary,panel);wrap.append(detail);detail.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',String(detail.open)));detail.addEventListener('keydown',e=>{if(e.key==='Escape'&&detail.open){e.preventDefault();detail.open=false;summary.focus()}});
}}
if(document.querySelector('.tok-body--studio,.studio-page')){installFieldWisdom();let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;installFieldWisdom()})}}).observe(document.body,{childList:true,subtree:true});}



