export const QA_ORIGIN='https://www.tidesofknowing.com';
export const QA_END='2026-11-02T15:02:00Z';
export function productionRoute(path:string):'public'|'studio'|'shared'|'blocked'{
 if(path.startsWith('/__'))return 'blocked';
 if(/^\/(studio|api\/studio)(\/|$)/.test(path)||/^\/artists\/(collaborate|visual-design-exchange)(\/|$)/.test(path)||/^\/api\/artists(\/|$)/.test(path)||/^\/ask-leilia\/admin\/studio-[a-z-]+\/?$/.test(path))return 'studio';
 if(path==='/community/account/'||/^\/api\/community\/(account|profile|notifications|admin\/users)(\/|$)/.test(path))return 'public';
 if(/^\/(community|api\/community)(\/|$)/.test(path)||/^\/ask-leilia\/admin\/?$/.test(path))return 'shared';
 return 'public';
}
