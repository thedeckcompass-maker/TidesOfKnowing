import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(
  'src/scripts/studioCommunityNotifications.ts','utf8'
);
const compiled="\"use strict\";\n\n// src/lib/studio/creatorJourney.ts\nvar CREATIVE_CHAPTERS = [\n  { id: \"spark\", name: \"The Spark\", output: \"Creative North Star\", question: \"What is your deck about, and why do you want to create it?\" },\n  { id: \"foundation\", name: \"The Foundation\", output: \"Creative Brief\", question: \"Who is this for, and what experience should it offer?\" },\n  { id: \"architecture\", name: \"The Architecture\", output: \"Deck Blueprint\", question: \"What structure best serves this idea?\" },\n  { id: \"expression\", name: \"The Expression\", output: \"Living Deck Manuscript\", question: \"Write and design the individual cards in your deck.\" },\n  { id: \"visual-world\", name: \"The Visual World\", output: \"Visual Design Book\", question: \"How will the deck communicate visually?\" },\n  { id: \"companion\", name: \"The Companion\", output: \"Companion Manuscript\", question: \"How will someone learn to use and understand it?\" },\n  { id: \"making\", name: \"The Making\", output: \"Production Book\", question: \"Plan the cards, guidebook, packaging and production.\" },\n  { id: \"into-the-world\", name: \"Into the World\", output: \"Publication and Launch Book\", question: \"How will the deck reach the people it was made for?\" }\n];\n\n// src/lib/studio/orientation.ts\nvar notes = [\n  [\n    \"\",\n    \"Explore the idea, purpose and perspective behind your deck. Record what draws you to it, what you hope it will offer and the creative principles you want to preserve. Bring selected reflections into an editable Creative North Star, while keeping your original words and saved versions available as the project evolves.\"\n  ],\n  [\n    \"\",\n    \"Define who may use your deck, the experience you want to offer and the language and boundaries that support it. Consider its purpose, use settings, creative principles and responsibilities. Bring your reflections into an editable Creative Brief, then refine that brief without replacing the original responses.\"\n  ],\n  [\n    \"\",\n    \"Explore the structure that serves your deck\\u2019s purpose. Describe its form, organizing ideas and intended use; review the existing card collection, families and relationships. Record connections and open questions, then bring your reflections into an editable Deck Blueprint as the collection develops.\"\n  ],\n  [\n    \"\",\n    \"Develop the writing and imagery of individual cards. Open a card, work with the deck\\u2019s shared guidebook sections and keep supporting notes where useful. Write in any order, save unfinished entries and return to the collection to consider how each card contributes to the whole.\"\n  ],\n  [\n    \"\",\n    \"Develop a visual language for your deck through imagery, symbols, color, typography and layout. Record visual direction, work with uploaded artwork and set shared card dimensions, borders, numbering and backs. Keep references and permissions with your working material, and choose deliberately what to share with an artist.\"\n  ],\n  [\n    \"\",\n    \"Develop the guidebook that helps people use and understand your deck. Write introductions and instructions, and adapt explicitly selected card material into editable entries. Consider what a deck user needs to know and how much interpretive freedom to leave. Review the manuscript in order while keeping adaptations and their recorded sources distinct.\"\n  ],\n  [\n    \"\",\n    \"Plan how your deck and companion publication will be produced. Record format, materials, packaging, quantities, supplier questions and cost assumptions, using the deck\\u2019s existing dimensions. Keep reference packages of selected versions and record proof decisions and remaining conditions as you prepare an edition.\"\n  ],\n  [\n    \"\",\n    \"Plan how your deck will reach the people you want to serve. Define success, develop a deck story from your own writing or deliberately selected excerpts, and consider publishing routes that fit your goals. Record release, delivery and follow-up plans at an appropriate scale. These plans remain private until you choose how to share them.\"\n  ]\n];\nvar ORIENTATION_CHAPTERS = CREATIVE_CHAPTERS.map((c, i) => ({ ...c, number: i + 1, why: notes[i][0], how: notes[i][1], colour: [\"#f6efe0\", \"#edf0e7\", \"#e5eded\", \"#eee8f1\", \"#f3e7e0\", \"#e9eff1\", \"#eaf0e6\", \"#f6efdf\"][i] }));\nfunction mapContext(raw, chapter, tool) {\n  const fallback = { path: \"/studio/\", projectId: null, node: \"overview\", label: \"Studio overview\", returnTo: \"/studio/\" };\n  if (!raw || raw.length > 1800 || !raw.startsWith(\"/\") || raw.startsWith(\"//\") || /[\\\\\\r\\n]/.test(raw)) return fallback;\n  let u;\n  try {\n    u = new URL(raw, \"https://studio.invalid\");\n    if (u.origin !== \"https://studio.invalid\" || decodeURIComponent(u.pathname).includes(\"\\\\\")) return fallback;\n  } catch {\n    return fallback;\n  }\n  const path = u.pathname.endsWith(\"/\") ? u.pathname : u.pathname + \"/\", m = path.match(/^\\/studio\\/projects\\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\/(.*)$/i);\n  const c = ORIENTATION_CHAPTERS.find((c2) => c2.id === (chapter ?? u.searchParams.get(\"chapter\")));\n  let node = \"overview\", label = \"Studio overview\", resourceId, kind;\n  if (m) {\n    const tail = m[2];\n    if (!tail) {\n      node = \"workshop\";\n      label = \"Workshop\";\n    } else if (tail === \"project-book/\") {\n      node = \"book\";\n      label = \"My Project Workbook\";\n    } else if (tail === \"guidebook-outline/\") {\n      node = \"spark\";\n      label = \"Card-entry setup\";\n    } else if (tail === \"exports/\") {\n      node = \"book\";\n      label = \"Exports\";\n    } else if (tail === \"production/\") {\n      node = \"making\";\n      label = \"Production plan\";\n    } else if (tail === \"cards/new/\") {\n      node = \"expression\";\n      label = \"Add a card\";\n    } else if (tail === \"my-deck/\") {\n      node = \"overview\";\n      label = \"My deck\";\n    } else if (tail === \"journey/\") {\n      node = c?.id ?? \"spark\";\n      label = c?.name ?? \"The Spark\";\n      if (u.hash === \"#project-book\" || tool === \"book\") {\n        node = \"book\";\n        label = \"My Project Workbook\";\n      } else if (tool === \"guidance\" || u.hash === \"#chapter-support\") {\n        node = \"guidance\";\n        label = \"Support options\" + (c ? \" \\u2014 \" + c.name : \"\");\n      }\n    } else if (/^cards\\/[a-f0-9-]{36}\\/$/i.test(tail)) {\n      node = \"expression\";\n      label = \"Card writing\";\n      kind = \"card\";\n      resourceId = tail.split(\"/\")[1];\n    } else if (/^(?:companion|guidebook)\\/[a-f0-9-]{36}\\/$/i.test(tail)) {\n      node = \"companion\";\n      label = \"Companion entry\";\n      kind = \"section\";\n      resourceId = tail.split(\"/\")[1];\n    } else if (tail === \"journal/\" || /^journal\\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\/$/i.test(tail)) {\n      node = \"journal\";\n      label = u.hash.includes(\"photograph\") ? \"Journal photographs\" : \"Private journal\";\n      if (tail !== \"journal/\") {\n        kind = \"journal\";\n        resourceId = tail.split(\"/\")[1];\n      }\n    } else if (tail === \"visual-exchange/\") {\n      node = \"artists\";\n      label = \"Visual Design Exchange\";\n    } else if (tail === \"crowd-funding/\" || tail === \"publishing/\") {\n      node = \"into-the-world\";\n      label = tail === \"crowd-funding/\" ? \"Crowd Funding\" : \"Publishing resources\";\n    } else if (tail === \"editorial/\") {\n      node = \"guidance\";\n      label = \"Confidential editorial feedback\";\n    } else return fallback;\n  } else if (path === \"/studio/creators-desk/\") {\n    label = \"Creator\\u2019s Desk\";\n  } else if (path === \"/studio/welcome/\") {\n    label = \"Welcome to the Studio\";\n  } else if (path === \"/studio/\" || path === \"/studio/account/\") {\n    label = path.includes(\"account\") ? \"Account\" : \"Studio overview\";\n  } else if ([\"/studio/artists/\", \"/artists/collaborate/\", \"/artists/visual-design-exchange/\"].includes(path)) {\n    node = \"artists\";\n    label = path === \"/studio/artists/\" ? \"Artist directory\" : path.includes(\"collaborate\") ? \"Artist profile\" : \"Visual Design Exchange\";\n  } else return fallback;\n  const params = new URLSearchParams();\n  if (m && m[2] === \"journey/\" && c) {\n    params.set(\"chapter\", c.id);\n    const n = u.searchParams.get(\"moment\");\n    if (n && /^\\d+$/.test(n) && Number(n) <= ([\"foundation\", \"architecture\"].includes(c.id) ? 5 : 4)) params.set(\"moment\", n);\n  }\n  if (m) {\n    for (const [key, values] of Object.entries({ book: [\"concept\", \"manuscript\", \"planning\"], task: [\"writing\", \"artwork\"], view: [\"project\"] })) {\n      const value = u.searchParams.get(key);\n      if (value && values.includes(value)) params.set(key, value);\n    }\n  }\n  const page = u.searchParams.get(\"page\");\n  if (m && m[2] === \"project-book/\" && page && /^[1-9][0-9]{0,4}$/.test(page)) params.set(\"page\", page);\n  const hash = [\"#project-book\", \"#chapter-support\", \"#journal-photographs\", \"#photographs\", \"#cards\", \"#guidebook\", \"#journal\"].includes(u.hash) ? u.hash : \"\";\n  const clean = path + (params.size ? \"?\" + params : \"\") + hash;\n  return { path: clean, projectId: m?.[1] ?? null, resourceId, kind, node, label, chapter: c?.id, returnTo: clean };\n}\n\n// src/lib/studio/communityNavigation.ts\nfunction communityWorkContext(raw) {\n  if (!raw || !raw.startsWith(\"/studio/projects/\")) return null;\n  const context = mapContext(raw);\n  if (!context.projectId) return null;\n  const hash = new URL(raw, \"https://studio.invalid\").hash;\n  const original = new URL(raw, \"https://studio.invalid\");\n  if (context.path.includes(\"/journey/\") && [\"making\", \"into-the-world\"].includes(context.chapter ?? \"\") && original.searchParams.get(\"moment\") === \"5\") {\n    const u = new URL(context.returnTo, \"https://studio.invalid\");\n    u.searchParams.set(\"moment\", \"5\");\n    context.path = u.pathname + u.search + u.hash;\n    context.returnTo = context.path;\n  }\n  if (context.path.includes(\"/project-book/\") && /^#book-(?:concept|manuscript|planning)-[a-f0-9-]{1,1500}$/.test(hash)) {\n    context.path = context.path.replace(/#.*$/, \"\") + hash;\n    context.returnTo = context.path;\n  }\n  if (context.path.includes(\"/my-deck/\")) context.label = \"My cards\";\n  if (context.path.includes(\"/guidebook-outline/\")) context.label = \"Design your guidebook\";\n  return context;\n}\nfunction communityContinuation(path, raw) {\n  const context = communityWorkContext(raw);\n  return context ? path + (path.includes(\"?\") ? \"&\" : \"?\") + \"from=\" + encodeURIComponent(context.returnTo) : path;\n}\n\n// src/scripts/studioCommunityNotifications.ts\nvar root = document.querySelector(\n  \"[data-community-notifications]\"\n);\nif (root) {\n  let destination2 = function(a) {\n    if (!uuid.test(a.post_id) || !chapters.has(a.chapter)) {\n      return null;\n    }\n    const base = a.capability === \"general_community\" ? \"/studio/community/\" : a.capability === \"private_community\" ? \"/studio/private-community/\" : null;\n    return base ? communityContinuation(a.capability === \"general_community\" ? `${base}${a.chapter}/discussion/${a.post_id}/` : `${base}?chapter=${encodeURIComponent(a.chapter)}#discussion-${a.post_id}`, new URL(location.href).searchParams.get(\"from\")) : null;\n  };\n  destination = destination2;\n  const endpoint = \"/api/studio/community-activity\";\n  const list = root.querySelector(\n    \"[data-community-activity-list]\"\n  );\n  const status = root.querySelector(\n    \"[data-community-activity-status]\"\n  );\n  const count = root.querySelector(\n    \"[data-community-unread-count]\"\n  );\n  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;\n  const chapters = /* @__PURE__ */ new Set([\n    \"spark\",\n    \"foundation\",\n    \"architecture\",\n    \"expression\",\n    \"visual-world\",\n    \"companion\",\n    \"making\",\n    \"into-the-world\"\n  ]);\n  async function acknowledge(id) {\n    if (!uuid.test(id)) return false;\n    const form = new FormData();\n    form.set(\"action\", \"ack\");\n    form.set(\"activity_id\", id);\n    try {\n      const response = await fetch(endpoint, {\n        method: \"POST\",\n        body: form,\n        credentials: \"same-origin\",\n        cache: \"no-store\",\n        signal: AbortSignal.timeout(4e3)\n      });\n      if (!response.ok) return false;\n      const data = await response.json();\n      return data.acknowledged === true;\n    } catch {\n      return false;\n    }\n  }\n  async function load() {\n    try {\n      let updateCount2 = function() {\n        count.hidden = unread === 0;\n        count.textContent = unread ? `${unread} unread` : \"\";\n      };\n      var updateCount = updateCount2;\n      const response = await fetch(endpoint, {\n        credentials: \"same-origin\",\n        cache: \"no-store\"\n      });\n      if (!response.ok) throw Error(\"Unavailable\");\n      const data = await response.json();\n      if (!Array.isArray(data.activities) || data.activities.length > 2e3) {\n        throw Error(\"Invalid activity response\");\n      }\n      const activities = data.activities.filter(\n        (a) => {\n          if (!a || typeof a !== \"object\") return false;\n          const v = a;\n          return typeof v.id === \"string\" && uuid.test(v.id) && typeof v.post_id === \"string\" && uuid.test(v.post_id) && typeof v.reply_id === \"string\" && uuid.test(v.reply_id) && typeof v.activity_type === \"string\" && typeof v.chapter === \"string\" && chapters.has(v.chapter) && (v.capability === \"general_community\" || v.capability === \"private_community\") && typeof v.created_at === \"string\" && (v.read_at === null || typeof v.read_at === \"string\");\n        }\n      );\n      let unread = activities.filter((a) => a.read_at === null).length;\n      updateCount2();\n      list.replaceChildren();\n      for (const activity of activities) {\n        const href = destination2(activity);\n        if (!href) continue;\n        const item = document.createElement(\"li\");\n        item.dataset.unread = String(activity.read_at === null);\n        const link = document.createElement(\"a\");\n        link.href = href;\n        link.textContent = activity.capability === \"private_community\" ? \"Private Community conversation\" : \"General Community conversation\";\n        const date = document.createElement(\"time\");\n        date.dateTime = activity.created_at;\n        date.textContent = \" \" + new Date(activity.created_at).toLocaleDateString(\"en-GB\");\n        item.append(link, date);\n        list.append(item);\n        link.addEventListener(\"click\", async (event) => {\n          if (activity.read_at !== null) return;\n          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;\n          event.preventDefault();\n          link.setAttribute(\"aria-busy\", \"true\");\n          try {\n            const ok = await acknowledge(activity.id);\n            if (ok) {\n              activity.read_at = (/* @__PURE__ */ new Date()).toISOString();\n              item.dataset.unread = \"false\";\n              unread = Math.max(0, unread - 1);\n              updateCount2();\n            }\n          } finally {\n            window.location.assign(href);\n          }\n        });\n      }\n      status.textContent = activities.length ? `${activities.length} Community updates.` : \"No Community updates yet.\";\n    } catch {\n      status.textContent = \"Community notifications are unavailable.\";\n      count.hidden = true;\n      list.replaceChildren();\n    }\n  }\n  void load();\n}\nvar destination;\n";

const ids=[
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
];

function harness({activities=[],loadFails=false,acknowledges=true}={}){
  const list={
    children:[],
    replaceChildren(){this.children=[];},
    append(node){this.children.push(node);}
  };
  const count={hidden:true,textContent:''};
  const status={textContent:''};
  const root={
    querySelector(selector){
      if(selector.includes('activity-list'))return list;
      if(selector.includes('unread-count'))return count;
      return status;
    }
  };
  const requests=[];
  const destinations=[];

  function element(tag){
    return {
      tag,
      dataset:{},
      listeners:{},
      children:[],
      append(...nodes){this.children.push(...nodes);},
      addEventListener(name,fn){this.listeners[name]=fn;},
      setAttribute(name,value){this[name]=value;}
    };
  }

  const context={
    exports:{},
    document:{
      querySelector:()=>root,
      createElement:element
    },
    fetch:async(url,options={})=>{
      requests.push({url,options});
      if(options.method==='POST'){
        return {
          ok:acknowledges,
          json:async()=>({acknowledged:acknowledges})
        };
      }
      return {
        ok:!loadFails,
        json:async()=>({activities})
      };
    },
    window:{
      location:{assign(url){destinations.push(url);}}
    },
    location:{href:"https://synthetic.invalid/studio/community/"},URL,AbortSignal,FormData,Date,Set,RegExp,
    encodeURIComponent,Error,Promise,String
  };

  vm.runInNewContext(compiled,context);

  return {
    list,count,status,requests,destinations,
    async settle(){
      for(let attempt=0;attempt<20;attempt++){
        if(status.textContent!=='')return;
        await new Promise(resolve=>setImmediate(resolve));
      }
      throw new Error('Notification controller did not finish loading.');
    }
  };
}

function activity(id,capability,read_at=null){
  return {
    id,post_id:id,reply_id:id,
    activity_type:'reply',
    chapter:'spark',capability,
    created_at:'2026-11-03T12:00:00Z',
    read_at
  };
}

test('Counts unread notifications',async()=>{
  const h=harness({activities:[
    activity(ids[0],'general_community'),
    activity(ids[1],'private_community','2026-11-03T13:00:00Z')
  ]});
  await h.settle();
  assert.equal(h.count.textContent,'1 unread');
  assert.equal(h.list.children.length,2);
});

test('Separates General and Private Community links',async()=>{
  const h=harness({activities:[
    activity(ids[0],'general_community'),
    activity(ids[1],'private_community')
  ]});
  await h.settle();
  const links=h.list.children.map(item=>item.children[0].href);
  assert.match(links[0],/^\/studio\/community\/spark\/discussion\//);
  assert.match(links[1],/^\/studio\/private-community\/\?chapter=spark#discussion-/);
});

test('Acknowledges before navigating',async()=>{
  const h=harness({activities:[
    activity(ids[0],'general_community')
  ]});
  await h.settle();
  const link=h.list.children[0].children[0];
  let prevented=false;
  await link.listeners.click({
    button:0,ctrlKey:false,metaKey:false,
    shiftKey:false,altKey:false,
    preventDefault(){prevented=true;}
  });
  assert.equal(prevented,true);
  assert.equal(h.count.hidden,true);
  assert.equal(h.destinations.length,1);
  assert.equal(h.requests.at(-1).options.method,'POST');
});

test('Failed notification loading shows an unavailable state',async()=>{
  const h=harness({loadFails:true});
  await h.settle();
  assert.equal(h.status.textContent,
    'Community notifications are unavailable.');
  assert.equal(h.list.children.length,0);
});

test('Invalid activity records are not rendered',async()=>{
  const h=harness({activities:[{
    ...activity(ids[0],'general_community'),
    post_id:'invalid'
  }]});
  await h.settle();
  assert.equal(h.list.children.length,0);
});





