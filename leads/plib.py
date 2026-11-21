import glob, json, os
D = os.path.dirname(os.path.abspath(__file__))
def files(): return sorted(glob.glob(D + '/prospects*.jsonl'))
def all_prospects():
    out = []
    for f in files():
        for l in open(f):
            if l.strip(): out.append(json.loads(l))
    return out
US_WORDS = [('colours','colors'),('colour','color'),('Colour','Color'),('favourite','favorite'),('organise','organize'),('personalised','personalized'),
  ('postcode','ZIP code'),('Pop in','Stop by'),('pop in','stop by'),('Book in','Book'),('mum','mom'),('Mum','Mom'),('enquir','inquir'),('Enquir','Inquir'),
  ('jewellery','jewelry'),('grey','gray'),('practise','practice'),('licence','license'),('programme','program'),('a proper consultation','a real consultation'),
  ('proper ','real '),('Proper ','Real '),('in store','in the store'),('fortnight','two weeks'),('car park','parking lot'),('pupil','student'),('Pupil','Student')]
def americanize(s):
    if not isinstance(s, str): return s
    for a, b in US_WORDS: s = s.replace(a, b)
    return s
