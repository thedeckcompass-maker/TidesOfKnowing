-- Correct Sasha's Ask Leilia review verification status.
-- Her completed One Question Reading is confirmed; the public badge is driven only by
-- verification_status through isVerifiedAskLeiliaReview() (same path as Hannah, Joyce,
-- and the verified Anonymous reviews). This does not hard-code a UI badge by name.
-- Idempotent. Does not alter review body, consent, publication permission, rating,
-- reading type, display name, or moderation status.

update public.ask_leilia_reviews
set
  verification_status = 'verified_completed_reading',
  updated_at = now()
where id = 'b071db83-f330-4f64-a54f-c397f6109923'
  and display_name = 'Sasha'
  and moderation_status = 'approved'
  and verification_status = 'unverified';
