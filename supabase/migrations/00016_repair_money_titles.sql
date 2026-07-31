-- Repair notification titles written before money_text() landed (00010).
--
-- add_violation used to build the amount with `r.amount_cents / 100.0`, whose
-- numeric→text cast keeps the full scale of the division — so titles read
-- "$1.00000000000000000000 to the jar". 00010 fixed how new rows are written
-- but left the existing ones, which are what people actually still see in their
-- alerts list.
--
-- Trailing digits past the first two are always zeros from that division, so
-- truncating is lossless. The trailing [0-9]+ means an already-correct "$2.00"
-- has nothing to match, making this safe to re-run.
update notifications
set title = regexp_replace(title, '\$([0-9]+)\.([0-9]{2})[0-9]+', '$\1.\2', 'g')
where title ~ '\$[0-9]+\.[0-9]{3,}';
