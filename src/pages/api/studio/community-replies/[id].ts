import type {APIRoute} from 'astro';
import {parseJsonOrForm} from '../../../../lib/community/api';
import {dcsParticipation} from '../../../../lib/community/dcsParticipation';
export const prerender=false;
export const POST:APIRoute=async(ctx)=>dcsParticipation(ctx,'reply',await parseJsonOrForm(ctx.request));

