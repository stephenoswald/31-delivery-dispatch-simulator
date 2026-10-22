# Three-portal demo

1. Start the seeded FastAPI backend on port 8000 and `npm run dev` in frontend.
2. Open separate tabs with Remember me unchecked, or separate browser profiles if
   Remember me is enabled. Default sessionStorage is per-tab; localStorage is shared.
3. Sign in as rider01@example.com with DemoPass123! and switch online.
4. Sign in as customer01@example.com. Choose New delivery, Old GRA pickup and
   D-Line drop-off. Add recipient/package details, then review and confirm.
5. Customer sees Finding a rider and status polling. Rider opens Nearby requests
   and accepts the request before its countdown ends.
6. Customer sees the accepted rider ID, fixed location snapshot, and timeline.
7. Rider confirms pickup, starts delivery, and confirms delivery using the modal
   prompts. These actions match the server's sequential lifecycle.
8. Customer submits a rating/comment. Refresh to confirm the existing review is
   shown instead of another review form.
9. Admin signs in as admin@example.com. Inspect orders, participants, simulated
   tracking, rider/customer directories, analytics, and date-filtered CSV reports.
10. For an unanswered/expired invitation, admin opens the pending order and uses
    Refresh nearby request with a suitable radius. No rider is assigned automatically.

All seeded demo passwords remain DemoPass123!. No signup, payment, pricing,
earnings, payout, or settings interaction is part of the demo. Phone identifiers
are synthetic; maps and positions are simulated and have no live GPS/ETA.

Browser QA used a disposable SQLite copy to run these actions and a separate
cancellation flow. It did not insert QA orders into the user's database.
