import os
D=os.path.dirname(os.path.abspath(__file__))
import json, html, re, os, sys

E = lambda s: html.escape(str(s or ""), quote=True)
TPL = open(D+'/template.html').read()

ICON = {
 'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
 'mail': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
 'pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
 'clock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
 'check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
 'star': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
 'spark': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
}

ART = {
 'dots': '<svg class="art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="currentColor"/></pattern></defs><rect width="400" height="200" fill="url(#p)"/></svg>',
 'waves': '<svg class="art" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2">' + ''.join(f'<path d="M0 {y} C100 {y-24} 300 {y+24} 400 {y}"/>' for y in range(10, 200, 18)) + '</g></svg>',
 'petals': '<svg class="art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="currentColor">' + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="16" ry="6" transform="rotate({(x*7+y*3)%180} {x} {y})"/>' for x in range(20, 400, 60) for y in range(20, 200, 55)) + '</g></svg>',
 'grid': '<svg class="art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="g" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs><rect width="400" height="200" fill="url(#g)"/></svg>',
 'leaves': '<svg class="art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2">' + ''.join(f'<path d="M{x} {y} q14 -22 28 0 q-14 22 -28 0z M{x} {y} h28"/>' for x in range(10, 400, 52) for y in range(24, 200, 44)) + '</g></svg>',
 'paws': '<svg class="art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="currentColor">' + ''.join(f'<g transform="translate({x} {y}) rotate({(x+y)%40-20})"><ellipse cx="0" cy="6" rx="7" ry="6"/><circle cx="-7" cy="-4" r="3"/><circle cx="0" cy="-7" r="3"/><circle cx="7" cy="-4" r="3"/></g>' for x in range(24, 400, 64) for y in range(26, 200, 58)) + '</g></svg>',
}

FONTS = {
 'serif': ('family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Inter:wght@400;600;700;800', "'Fraunces',Georgia,serif", 'Inter,system-ui,sans-serif', 800, 800),
 'grotesk': ('family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600;700;800', "'Space Grotesk',system-ui,sans-serif", 'Inter,system-ui,sans-serif', 700, 700),
 'jakarta': ('family=Plus+Jakarta+Sans:wght@400;600;700;800', "'Plus Jakarta Sans',system-ui,sans-serif", "'Plus Jakarta Sans',system-ui,sans-serif", 800, 800),
 'dm': ('family=DM+Serif+Display&family=DM+Sans:wght@400;600;700;800', "'DM Serif Display',Georgia,serif", "'DM Sans',system-ui,sans-serif", 400, 400),
 'bricolage': ('family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;600;700;800', "'Bricolage Grotesque',system-ui,sans-serif", 'Inter,system-ui,sans-serif', 800, 800),
}

def theme(bg, surface, ink, mute, line, brand, brand_ink, accent, accent_ink, hero, hero_ink, soft):
    return (f"--bg:{bg};--surface:{surface};--ink:{ink};--mute:{mute};--line:{line};--brand:{brand};--brand-ink:{brand_ink};"
            f"--accent:{accent};--accent-ink:{accent_ink};--hero:{hero};--hero-ink:{hero_ink};--soft:{soft};")

# Category presets. {t} = town, {n} = name
CAT = {
 'dog': dict(font='bricolage', art='paws', theme=theme('#f7faf9','#fff','#13201f','#5b6b69','#e1e9e7','#0f6b66','#fff','#ffcc4d','#1d1a0f','#0f5e5a','#fff','#eaf3f1'),
   eyebrow='Dog grooming · {t}', headline='Happy dogs, beautifully groomed.', sub='Calm, careful grooming for every breed in {t}. Book in, drop off (or we come to you), and get back a fresh, happy dog.',
   svc='Services', svc_title='Grooms for every coat', svc_intro='Every dog is checked over first, so the groom suits their coat, skin and temperament.',
   how='Booking takes a minute', steps=[('Get in touch','Call or email with your dog\'s breed, size and what you\'d like done.'),('Pick a slot','We\'ll offer the next free appointment that suits you.'),('Collect a happy dog','Bathed, groomed and looking their best.')],
   faq=[('How long does a groom take?','Most full grooms take a couple of hours depending on size and coat. We\'ll give you a time when you book.'),('Do you groom nervous dogs?','Yes. Let us know when you book and we\'ll take it slowly and keep things calm.'),('How often should my dog be groomed?','For most coats every 6 to 8 weeks keeps them comfortable. We\'re happy to advise.')],
   cta='Ready for a fresh, happy pup?', visit='Find us', visit_title='Get in touch'),
 'florist': dict(font='dm', art='petals', theme=theme('#fbf7f5','#fff','#1f1a1a','#6b5e5e','#eee3df','#7a2e45','#fff','#e9a3b4','#2a1218','#3d2a2f','#fff','#f6ece8'),
   eyebrow='Independent florist · {t}', headline='Flowers that say it properly.', sub='Hand-tied bouquets, weddings and sympathy flowers, made by real florists in {t} and delivered locally.',
   svc='Flowers', svc_title='Something for every moment', svc_intro='Everything is made by hand to order. Call or email with an occasion and a budget and we\'ll do the rest.',
   how='Ordering is easy', steps=[('Choose or describe','Pick a style, or tell us the occasion, colours and budget.'),('We make it by hand','Your flowers are arranged fresh, on the day.'),('Delivered or collected','Local delivery, or pop in and collect.')],
   faq=[('Do you deliver?','Yes, locally. Call or email with the address and we\'ll confirm delivery options and timing.'),('Can I order for a funeral?','Yes. We\'ll talk you through tributes gently and make sure they arrive on time.'),('Do you do weddings?','Yes. Get in touch with your date and we\'ll arrange a consultation.')],
   cta='Send something beautiful today.', visit='Visit', visit_title='Visit the shop'),
 'cafe': dict(font='serif', art='dots', theme=theme('#faf6f0','#fff','#23170f','#6e5f53','#ece2d6','#6b3b1f','#fff','#f2b84b','#2a1a05','#3b2418','#fff','#f3ebe1'),
   eyebrow='Café · {t}', headline='Good coffee, proper food.', sub='Freshly made breakfast, lunch and cakes in {t}. Pop in, or call ahead for bigger groups.',
   svc='Menu', svc_title='What we serve', svc_intro='A taste of the menu. Ask in store for today\'s specials.',
   how='Visiting', steps=[('Pop in','Walk-ins welcome during opening hours.'),('Order at the counter','Eat in or take away.'),('Planning something?','Call or email about parties and private hire.')],
   faq=[('Do I need to book?','Walk-ins are welcome. For bigger groups, call ahead and we\'ll do our best to fit you in.'),('Do you cater for dietary needs?','Ask the team when you order and they\'ll tell you what\'s suitable.'),('Do you do private hire?','Get in touch with the date and numbers and we\'ll see what we can do.')],
   cta='Come in for a coffee.', visit='Visit', visit_title='Find us'),
 'hair': dict(font='dm', art='waves', theme=theme('#faf8f7','#fff','#1d1718','#6c6061','#ece5e3','#4a2140','#fff','#d9b26a','#21170a','#2a1626','#fff','#f3eeec'),
   eyebrow='Hair salon · {t}', headline='Hair you\'ll love leaving with.', sub='Cuts, colour and treatments in {t}, done properly by people who listen first.',
   svc='Services', svc_title='Cut, colour & care', svc_intro='Every appointment starts with a proper consultation so you get exactly what you want.',
   how='Booking', steps=[('Get in touch','Call or email with what you\'d like and when.'),('Consultation','We\'ll chat through the look and the time it needs.'),('Leave loving it','Styled, finished and ready to go.')],
   faq=[('Do I need a patch test for colour?','For most colour services, yes. We\'ll arrange one before your appointment.'),('How far ahead should I book?','Popular slots go quickly, so a week or two ahead is ideal.'),('Do you cut men\'s hair?','Ask when you book and we\'ll let you know.')],
   cta='Book your next appointment.', visit='Visit', visit_title='Find the salon'),
 'cleaning': dict(font='grotesk', art='grid', theme=theme('#f4f8fb','#fff','#0f1d2b','#566576','#dde6ee','#0d4f8b','#fff','#38d1c0','#062a26','#0b3a66','#fff','#e8f0f7'),
   eyebrow='{trade} · {t}', headline='Spotless, without the hassle.', sub='Reliable, insured cleaning across {t} and nearby. Get a free quote and a clear price before we start.',
   svc='Services', svc_title='What we clean', svc_intro='Tell us what needs doing and we\'ll give you a clear quote, with no surprises.',
   how='How it works', steps=[('Free quote','Call or email with what needs doing.'),('Book a time','Pick a date that suits, one-off or regular.'),('Job done','We clean, check, and leave it spotless.')],
   faq=[('Are you insured?','Ask us for details when you get a quote and we\'ll send them over.'),('Do you cover my area?','We work across {t} and the surrounding area. Call to check your postcode.'),('How do I get a price?','Call or email with what you need and we\'ll give you a clear, free quote.')],
   cta='Get your free quote today.', visit='Contact', visit_title='Get a quote'),
 'garden': dict(font='serif', art='leaves', theme=theme('#f6f7f1','#fff','#1a2214','#5f6a55','#e3e7da','#2f5a27','#fff','#d8b25a','#21190a','#24401f','#fff','#ecefe3'),
   eyebrow='{trade} · {t}', headline='Gardens worth stepping out into.', sub='Maintenance, landscaping and tree work across {t}, done tidily by people who care how it looks.',
   svc='Services', svc_title='What we do', svc_intro='From regular upkeep to bigger projects. Every job starts with a free visit and a clear quote.',
   how='How it works', steps=[('Free visit','We come and look, then talk it through with you.'),('Clear quote','You get a written price before anything starts.'),('Job done properly','Tidy work, and we take the waste away.')],
   faq=[('Do you take garden waste away?','Ask when we quote and we\'ll include it.'),('Are you insured?','Ask us and we\'ll send details with your quote.'),('Which areas do you cover?','{t} and the surrounding area. Call to check.')],
   cta='Let\'s sort your garden.', visit='Contact', visit_title='Book a free visit'),
 'trades': dict(font='grotesk', art='grid', theme=theme('#f5f6f8','#fff','#141821','#5a6170','#e1e4ea','#c2410c','#fff','#f59e0b','#1f1300','#1b2230','#fff','#eceef2'),
   eyebrow='{trade} · {t}', headline='Done right, first time.', sub='Trusted {trade_l} across {t} and nearby. Clear quotes, tidy work, and we turn up when we say we will.',
   svc='Services', svc_title='How we can help', svc_intro='Call or email with what you need for a clear, no-obligation quote.',
   how='How it works', steps=[('Tell us the job','Call or email with a few details, or photos.'),('Get a clear quote','A fixed price or day rate, agreed before we start.'),('Job done properly','Tidy work, tested, and explained.')],
   faq=[('Do you give free quotes?','Yes. Call or email and we\'ll arrange a quote.'),('Which areas do you cover?','{t} and the surrounding area. Call to check your postcode.'),('Can you help in an emergency?','Call us and we\'ll tell you how quickly we can get to you.')],
   cta='Get your free quote.', visit='Contact', visit_title='Get in touch'),
 'fitness': dict(font='jakarta', art='waves', theme=theme('#f6f6fb','#fff','#16152a','#5e5d74','#e3e2ef','#4338ca','#fff','#fb7185','#2a0a10','#1e1b4b','#fff','#ecebf7'),
   eyebrow='{trade} · {t}', headline='Stronger, fitter, and enjoying it.', sub='Small-group and one-to-one sessions in {t}, for every age and fitness level.',
   svc='Classes', svc_title='Ways to train', svc_intro='Not sure where to start? Get in touch and we\'ll suggest the right fit.',
   how='Getting started', steps=[('Say hello','Call or email and tell us your goals.'),('Try a session','We\'ll find the right class or plan for you.'),('Keep going','Regular sessions, real progress.')],
   faq=[('I\'m a complete beginner. Is that okay?','Absolutely. Sessions are pitched to your level.'),('Do I need any equipment?','Ask when you book and we\'ll tell you what to bring.'),('Can I try before committing?','Get in touch and we\'ll talk through your options.')],
   cta='Book your first session.', visit='Contact', visit_title='Get started'),
 'tutor': dict(font='jakarta', art='dots', theme=theme('#f7f8fc','#fff','#141a2e','#5b6380','#e2e6f2','#1d4ed8','#fff','#facc15','#1f1a00','#172554','#fff','#eaeefa'),
   eyebrow='Private tuition · {t}', headline='Confidence first. Grades follow.', sub='Friendly, expert tutors for every stage, from primary to GCSE and beyond, in {t} and online.',
   svc='Subjects', svc_title='What we teach', svc_intro='Every pupil gets a plan built around their goals, gaps and exam dates.',
   how='How it works', steps=[('Free chat','Tell us about your child and what they need.'),('Matched tutor','We pair them with the right tutor.'),('Steady progress','Regular sessions and clear feedback.')],
   faq=[('Do you tutor online?','Get in touch and we\'ll tell you what\'s available.'),('How often are sessions?','Usually weekly, but we\'ll suggest what suits your child.'),('Can you help with exam prep?','Yes, we build sessions around the exams coming up.')],
   cta='Book a free chat.', visit='Contact', visit_title='Talk to us'),
 'stay': dict(font='serif', art='leaves', theme=theme('#f8f6f1','#fff','#1d1c16','#66645a','#e8e4d9','#3f4f2e','#fff','#c9a45c','#1f1706','#2b3322','#fff','#efece3'),
   eyebrow='Bed & breakfast · {t}', headline='A proper country welcome.', sub='Comfortable rooms and a hearty breakfast in {t}. Perfect for walkers, weddings and quiet weekends away.',
   svc='Your stay', svc_title='What\'s included', svc_intro='Email or call to check dates and rates.',
   how='Booking', steps=[('Check dates','Email or call with your dates.'),('Confirm','We\'ll confirm your room and rate.'),('Arrive and relax','Your room is ready when you are.')],
   faq=[('Is parking available?','Ask when you book and we\'ll confirm.'),('Is breakfast included?','Breakfast details are confirmed with your booking.'),('Can you recommend walks nearby?','Of course, just ask when you arrive.')],
   cta='Check availability.', visit='Contact', visit_title='Book your stay'),
 'shop': dict(font='dm', art='grid', theme=theme('#f7f6f3','#fff','#1a1917','#65625b','#e6e3dc','#1f3a5f','#fff','#e0a458','#20160a','#1d2a3a','#fff','#efede7'),
   eyebrow='{trade} · {t}', headline='Made properly, by hand.', sub='Expert, independent {trade_l} in {t}. Pop in or get in touch for advice and a price.',
   svc='Services', svc_title='What we do', svc_intro='Bring it in or get in touch and we\'ll talk you through options and prices.',
   how='How it works', steps=[('Bring it in','Pop in during opening hours, or email first.'),('Choose together','We\'ll talk through options and price.'),('Collect','We\'ll let you know when it\'s ready.')],
   faq=[('Do I need an appointment?','Walk-ins are welcome during opening hours.'),('How long does it take?','Ask in store and we\'ll give you a date.'),('Can I get a price first?','Yes, just ask.')],
   cta='Pop in or get in touch.', visit='Visit', visit_title='Find us'),
}


CAT['cakes'] = dict(font='dm', art='dots', theme=theme('#fdf8f6','#fff','#251a1c','#6f6063','#efe4e2','#8a3b55','#fff','#f3c3cf','#2a1218','#4a2433','#fff','#f7eeec'),
   eyebrow='Handmade cakes · {t}', headline='Cakes people remember.', sub='Bespoke celebration and wedding cakes, made by hand in {t} and designed around your day.',
   svc='Cakes', svc_title='What I make', svc_intro='Every cake is designed for you. Get in touch with your date, numbers and ideas for a quote.',
   how='Ordering', steps=[('Share your idea','Email or call with the date, number of guests and theme.'),('Design & quote','I\'ll sketch out ideas and give you a clear price.'),('Collect or delivered','Your cake, ready on the day.')],
   faq=[('How far ahead should I order?','As early as you can, especially for weddings. Get in touch to check your date.'),('Can you do dietary requirements?','Ask when you enquire and I\'ll tell you what\'s possible.'),('Do you deliver?','Ask when you order and we\'ll arrange collection or delivery.')],
   cta='Let\'s design your cake.', visit='Contact', visit_title='Get in touch')
CAT['beauty'] = dict(font='dm', art='waves', theme=theme('#fbf8f7','#fff','#201a1b','#6d6264','#ede5e3','#8b4f6b','#fff','#e7c08a','#24180a','#3a2430','#fff','#f5eeec'),
   eyebrow='{trade} · {t}', headline='Time out, properly looked after.', sub='Relaxing, professional treatments in {t}. Book a slot that suits you and leave feeling brand new.',
   svc='Treatments', svc_title='Treatments', svc_intro='Not sure what to choose? Get in touch and we\'ll recommend the right treatment.',
   how='Booking', steps=[('Get in touch','Call, text or email with the treatment you\'d like.'),('Choose a time','Pick a slot that suits you.'),('Relax','Lie back and leave the rest to us.')],
   faq=[('Do you offer gift vouchers?','Ask us and we\'ll let you know.'),('How long are treatments?','It depends on the treatment. We\'ll confirm when you book.'),('Is there parking?','Ask when you book and we\'ll explain where to park.')],
   cta='Book your treatment.', visit='Contact', visit_title='Book in')

CAT['health'] = dict(font='jakarta', art='waves', theme=theme('#f5f9f9','#fff','#11211f','#56676a','#dfe9e8','#0f766e','#fff','#fbbf77','#2a1700','#134e4a','#fff','#e8f2f1'),
   eyebrow='{trade} · {t}', headline='Feel better, properly.', sub='Experienced, registered care in {t}. Book an appointment and we\'ll take the time to understand what\'s going on.',
   svc='Treatments', svc_title='How we can help', svc_intro='Not sure which treatment is right? Get in touch and we\'ll point you in the right direction.',
   how='Your first visit', steps=[('Get in touch','Call or email to book or ask a question.'),('Assessment','We listen, assess and explain what we find.'),('Treatment plan','A clear plan, with nothing you don\'t need.')],
   faq=[('Do I need a GP referral?','Usually not. Get in touch and we\'ll advise.'),('How long is an appointment?','It depends on the treatment. We\'ll confirm when you book.'),('What should I bring?','Just yourself and any relevant notes. We\'ll tell you anything else when you book.')],
   cta='Book an appointment.', visit='Contact', visit_title='Get in touch')

CAT['events'] = dict(font='bricolage', art='dots', theme=theme('#f8f7f4','#fff','#1a1916','#636058','#e7e4dc','#9a3412','#fff','#fbbf24','#1f1500','#1c1917','#fff','#f0ede6'),
   eyebrow='{trade} · {t}', headline='Make the day one to remember.', sub='{trade} for weddings, parties and events across {t} and beyond. Tell us your date and we\'ll take it from there.',
   svc='Services', svc_title='What we offer', svc_intro='Every event is different. Get in touch with your date, venue and numbers for a tailored quote.',
   how='How it works', steps=[('Check your date','Email or call with your date and venue.'),('Tailored quote','We\'ll put together options and a clear price.'),('On the day','We turn up, set up and look after everything.')],
   faq=[('How far ahead should we book?','Popular dates go early, so get in touch as soon as you have yours.'),('Do you travel?','We cover {t} and further afield. Ask about your venue.'),('Is a deposit needed?','We\'ll explain how booking works when we send your quote.')],
   cta='Check your date.', visit='Contact', visit_title='Get in touch')

CAT['riding'] = dict(font='serif', art='leaves', theme=theme('#f7f6f1','#fff','#1c1a14','#66625a','#e6e2d8','#5b3a1e','#fff','#d9b25f','#1f1606','#2f2416','#fff','#efebe2'),
   eyebrow='{trade} · {t}', headline='Confident riders, happy horses.', sub='Riding lessons and livery in {t}, for complete beginners through to experienced riders.',
   svc='What we offer', svc_title='Lessons, livery & more', svc_intro='Not sure where to start? Get in touch and we\'ll suggest the right lesson or package.',
   how='Getting started', steps=[('Get in touch','Call or email and tell us about your riding experience.'),('Book a lesson','We\'ll match you to the right pony or horse and instructor.'),('Ride and progress','Regular lessons with clear progress.')],
   faq=[('Do I need my own equipment?','Ask when you book and we\'ll tell you what to bring and what we can lend.'),('Is there a minimum age?','Get in touch and we\'ll tell you which lessons suit your child.'),('Do you offer livery?','Ask us about current livery spaces and packages.')],
   cta='Book your first lesson.', visit='Visit', visit_title='Find the yard')
CAT['dance'] = dict(font='jakarta', art='waves', theme=theme('#fbf7fb','#fff','#1f1424','#6b5d70','#ece2ee','#7e22ce','#fff','#f9a8d4','#2a0a1c','#3b0764','#fff','#f4ecf6'),
   eyebrow='Dance school · {t}', headline='Where little feet learn to fly.', sub='Friendly, expert dance classes in {t} for every age, from first steps to exams and shows.',
   svc='Classes', svc_title='Classes for every age', svc_intro='Not sure which class? Get in touch and we\'ll suggest the right one, with a trial first.',
   how='Joining', steps=[('Get in touch','Email or call with your child\'s age and interests.'),('Try a class','Come along and see if it\'s the right fit.'),('Dance with us','Regular classes, exams and shows.')],
   faq=[('Can my child try a class first?','Get in touch and we\'ll arrange a trial.'),('What should they wear?','We\'ll send uniform details when you book.'),('Do you do exams and shows?','Ask us about exams and our shows when you get in touch.')],
   cta='Book a trial class.', visit='Contact', visit_title='Get in touch')

CAT['boarding'] = dict(font='bricolage', art='paws', theme=theme('#f8f8f4','#fff','#1c1d16','#63655a','#e5e6dc','#3f6212','#fff','#fcd34d','#1f1600','#2b3a12','#fff','#eff1e6'),
   eyebrow='{trade} · {t}', headline='Their holiday, while you\'re on yours.', sub='Licensed, family-run boarding in {t}. Clean, calm and caring, so you can go away without worrying.',
   svc='Rooms & prices', svc_title='Boarding options', svc_intro='Prices are per day. Book early for school holidays and Christmas.',
   how='Booking a stay', steps=[('Check dates','Call or email with your dates and pet details.'),('Confirm','We\'ll confirm the booking and what to bring.'),('Drop off & relax','We\'ll take great care of them until you\'re back.')],
   faq=[('Do vaccinations need to be up to date?','Yes. We\'ll tell you exactly what\'s needed when you book.'),('Can I bring their own bedding or food?','Ask when you book and we\'ll explain what helps them settle.'),('When can I drop off and collect?','During our opening hours, shown on this page.')],
   cta='Book their stay.', visit='Visit', visit_title='Find us')

CAT['petcare'] = dict(font='bricolage', art='paws', theme=theme('#f7f9fb','#fff','#14202b','#5a6876','#e0e7ee','#1d4f91','#fff','#fcd34d','#1f1600','#173d6e','#fff','#eaf0f6'),
   eyebrow='{trade} · {t}', headline='Happy pets while you\'re away.', sub='Trusted, experienced pet care in {t}. Walks, visits and sitting, so your pets stay happy at home.',
   svc='Services', svc_title='How we can help', svc_intro='Every pet is different. Get in touch and we\'ll put together the right care for yours.',
   how='Getting started', steps=[('Say hello','Call or email with your pets and dates.'),('Meet & greet','We meet you and your pets before the first booking.'),('Peace of mind','Updates while you\'re away, so you know they\'re happy.')],
   faq=[('Are you insured?','Ask us and we\'ll send details.'),('Which areas do you cover?','{t} and nearby. Get in touch to check.'),('Do you look after cats and small pets too?','Ask us about your pets and we\'ll tell you what we can do.')],
   cta='Book a meet & greet.', visit='Contact', visit_title='Get in touch')

CAT['music'] = dict(font='jakarta', art='waves', theme=theme('#f7f8fc','#fff','#141a2e','#5b6380','#e2e6f2','#4338ca','#fff','#facc15','#1f1a00','#1e1b4b','#fff','#eceefb'),
   eyebrow='Music lessons · {t}', headline='Music lessons they look forward to.', sub='Friendly, experienced teachers for every age and level in {t}, from first notes to performances.',
   svc='Lessons', svc_title='What we teach', svc_intro='Not sure where to start? Get in touch and we\'ll suggest the right teacher and lesson.',
   how='Getting started', steps=[('Get in touch','Call or email with the instrument, age and experience.'),('First lesson','We match you with the right teacher and time.'),('Keep playing','Regular lessons and chances to perform.')],
   faq=[('Do you teach complete beginners?','Yes. Get in touch and we\'ll find the right starting point.'),('How long are lessons?','Ask us about lesson lengths and times when you get in touch.'),('Do adults take lessons too?','Get in touch and we\'ll tell you what\'s available for adults.')],
   cta='Book a first lesson.', visit='Contact', visit_title='Get in touch')

CAT['driving'] = dict(font='grotesk', art='grid', theme=theme('#f5f7fa','#fff','#121a26','#566274','#dfe5ee','#0f766e','#fff','#fbbf24','#1f1600','#0f2f3a','#fff','#e8eff2'),
   eyebrow='Driving school · {t}', headline='Calm lessons. Confident drivers.', sub='Patient, friendly driving instruction in {t} for teens and adults, from first lesson to road test.',
   svc='Courses', svc_title='Courses & lessons', svc_intro='Not sure which course you need? Call or email and we\'ll point you to the right one.',
   how='Getting started', steps=[('Get in touch','Call or email with your age and permit status.'),('Book your course','We\'ll find a class or lesson time that suits you.'),('Pass with confidence','Practice, prepare and take your road test.')],
   faq=[('Do you teach adults?','Get in touch and we\'ll tell you about adult lessons.'),('Can I take the road test with you?','Ask us about road tests when you book.'),('Do you pick up from home?','Ask us when you book and we\'ll explain the options.')],
   cta='Book your first lesson.', visit='Contact', visit_title='Get in touch')

def tel(p):
    d = re.sub(r'[^\d+]', '', p or '')
    if d.startswith('0'): d = '+44' + d[1:]
    elif len(d) == 10 and not d.startswith('+'): d = '+1' + d  # US numbers
    return d

def build(r):
    c = CAT[r['cat']]
    if r.get('country') == 'US':
        from plib import americanize
        c = {k: (americanize(v) if isinstance(v, str) else [tuple(americanize(x) for x in i) for i in v] if isinstance(v, list) else v) for k, v in c.items()}
    fonts = FONTS[c['font']]
    t = r['town']; trade = r.get('trade') or ''
    fill = lambda s: s.replace('{t}', t).replace('{trade}', trade).replace('{trade_l}', trade.lower()).replace('{n}', r['name'])
    name = r['name']
    ph, em = r.get('phone'), r.get('email')
    cta_btns = []
    if ph: cta_btns.append(f'<a class="btn pri" href="tel:{tel(ph)}">{ICON["phone"]}Call {E(ph)}</a>')
    if em: cta_btns.append(f'<a class="btn {"sec" if ph else "pri"}" href="mailto:{E(em)}">{ICON["mail"]}Email us</a>')
    top = f'<a class="btn pri sm" href="{"tel:"+tel(ph) if ph else "mailto:"+E(em)}">{"Call" if ph else "Email"}</a>'
    bar = ''.join(x.replace('btn pri','btn pri sm').replace('btn sec','btn sec sm') for x in cta_btns)
    bar = re.sub(r'Call [^<]+', 'Call', bar)
    quick = []
    if r.get('hours'): quick.append(f'<div class="qrow">{ICON["clock"]}<span>' + '<br>'.join(f'{E(a)}: {E(b)}' for a, b in r['hours'][:3]) + '</span></div>')
    if r.get('address'): quick.append(f'<div class="qrow">{ICON["pin"]}<span>{E(r["address"])}</span></div>')
    if ph: quick.append(f'<div class="qrow">{ICON["phone"]}<span><a href="tel:{tel(ph)}">{E(ph)}</a></span></div>')
    if em: quick.append(f'<div class="qrow">{ICON["mail"]}<span><a href="mailto:{E(em)}">{E(em)}</a></span></div>')
    chips = []
    if r.get('since'):
        s = str(r['since']); chips.append(('star', f'Since {s}' if re.fullmatch(r'\d{4}', s) else f'{s} experience'))
    chips.append(('pin', f'{t} & nearby'))
    for x in r.get('chips', []): chips.append(('check', x))
    chips.append(('check', 'Free quotes' if r['cat'] in ('cleaning', 'garden', 'trades') else 'Easy booking'))
    chips_html = ''.join(f'<span class="chip">{ICON[i]}{E(x)}</span>' for i, x in chips)
    anyp = any(b for a, b in r['services'])
    svcs = ''.join(
        f'<div class="card svc"><span class="ic">{ICON["spark"]}</span><b>{E(a)}</b>'
        + (f'<span class="price">{E(b)}</span>' if b else ('<span class="price q">Ask for a price</span>' if anyp else '')) + '</div>'
        for a, b in r['services'])
    steps = ''.join(f'<div class="card step"><b>{E(a)}</b><p>{E(b)}</p></div>' for a, b in c['steps'])
    faq = ''.join(f'<details><summary>{E(fill(q))}</summary><p>{E(fill(a))}</p></details>' for q, a in c['faq'])
    contact = ''.join(quick[1:] if r.get('hours') else quick)
    if r.get('hours'):
        hours = '<div class="kicker" style="visibility:hidden">.</div><h2>Opening hours</h2><div class="card hours">' + ''.join(f'<div class="hrow"><span>{E(a)}</span><span>{E(b)}</span></div>' for a, b in r['hours']) + '</div>'
    else:
        hours = f'<div class="kicker" style="visibility:hidden">.</div><h2>Quick to reach</h2><div class="card about"><p>Call or email any time and we\'ll get back to you quickly. We cover {E(t)} and the surrounding area.</p><div class="ctas" style="margin-top:6px">{"".join(cta_btns)}</div></div>'
    status = '<div class="status" id="st" hidden></div>' if r.get('hours') else ''
    rep = {
        'FONTS': fonts[0], 'THEME': c['theme'] + f"--display:{fonts[1]};--body:{fonts[2]};--h1w:{fonts[3]};--h2w:{fonts[4]};",
        'NAME': E(name), 'NAME_ESC': E(name), 'TOWN': E(t), 'INITIAL': E(re.sub(r'^(the|The)\s+', '', name)[:1].upper()),
        'SVC_LABEL': c['svc'], 'VISIT_LABEL': c['visit'], 'TOP_CTA': top, 'ART': ART[c['art']],
        'EYEBROW': E(fill(c['eyebrow'])), 'HEADLINE': E(r.get('headline') or fill(c['headline'])), 'SUB': E(r.get('sub') or fill(c['sub'])),
        'HERO_CTAS': ''.join(cta_btns), 'STATUS': status, 'QUICK': ''.join(quick), 'CHIPS': chips_html,
        'SVC_TITLE': E(c['svc_title']), 'SVC_INTRO': E(fill(c['svc_intro'])), 'SERVICES': svcs,
        'HOW_TITLE': E(c['how']), 'STEPS': steps, 'ABOUT_TITLE': E(f'About {name}'), 'ABOUT': E(r['about']),
        'AREA_LINE': E(f'Based in {t}, serving the surrounding area.'), 'FAQ': faq,
        'VISIT_TITLE': E(c['visit_title']), 'CONTACT': contact, 'HOURS_BLOCK': hours, 'CTA_TITLE': E(fill(c['cta'])),
        'PRICE_LINE': ('A site like this is $250 to build, then $30 a month for hosting and changes.' if r.get('country') == 'US' else 'A site like this is £200 to build, then £25 a month for hosting and changes.'),
        'BAR': bar, 'HOURS_JSON': json.dumps(r.get('hours') or []),
    }
    out = TPL
    for k, v in rep.items(): out = out.replace('{{' + k + '}}', v)
    assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
    return out

if __name__ == '__main__':
    site = sys.argv[1]
    n = 0
    sys.path.insert(0, D)
    from plib import all_prospects
    only = set(sys.argv[2:])
    for r in all_prospects():
        if only and r['slug'] not in only: continue
        os.makedirs(f'{site}/{r["slug"]}', exist_ok=True)
        open(f'{site}/{r["slug"]}/index.html', 'w').write(build(r)); n += 1
    print('built', n)
