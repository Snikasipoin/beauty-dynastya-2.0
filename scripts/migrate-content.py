"""Извлекает контент пяти исходных страниц без повторного ввода биографий."""
from html.parser import HTMLParser
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'beauty-dynastya-main'

class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def all(self, selector):
        def matches(node):
            if selector.startswith('.'):
                return selector[1:] in node.attrs.get('class', '').split()
            if selector.startswith('#'):
                return node.attrs.get('id') == selector[1:]
            return node.tag == selector
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if matches(child):
                    result.append(child)
                result.extend(child.all(selector))
        return result

    def one(self, selector):
        found = self.all(selector)
        return found[0] if found else Node()

    def text(self):
        return ' '.join(' '.join(c.text() if isinstance(c, Node) else c for c in self.children).split())

class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node('document')
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack)-1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)

def text(node, selector):
    return node.one(selector).text()

def identity(card, kind):
    poster = Path(card.one('img').attrs['src']).stem
    return {
        'id': poster,
        'name': text(card, f'.{kind}__name'),
        'poster': poster,
        'links': [{'href': a.attrs['href'], 'label': a.text()} for a in card.all('.insta')],
    }

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf8')

documents = {}
for language in ('en', 'ru', 'it', 'de', 'fr'):
    path = SOURCE / ('index.html' if language == 'en' else f'{language}/index.html')
    documents[language] = Document(path.read_text(encoding='utf8')).root

english = documents['en']
country_codes = {'Bulgaria':'BG','Spain':'ES','Cuba':'CU','Denmark':'DK','France':'FR','Germany':'DE','Great Britain':'GB','Lithuania':'LT','Israel':'IL','Italy':'IT','Latvia':'LV','Poland':'PL','Romania':'RO','Slovakia':'SK','Switzerland':'CH','United States':'US'}
judges = [dict(identity(c, 'judge'), category=c.attrs['data-category'], countryCodes=[country_codes[country.strip()] for country in text(c,'.judge__country').split('/')], tier='vip' if 'judge--vip' in c.attrs['class'] else 'standard') for c in english.all('.judge')]
speakers = [dict(identity(c, 'speaker'), factIds=[f'fact{i}' for i, _ in enumerate(c.all('dt'))]) for c in english.all('.speaker')]
participants = [identity(c, 'participant') for c in english.all('.participant')]
partner = english.one('.partner')
partners = [dict(identity(partner, 'speaker'), id='beauty-panda')]
for filename, records, entity in [('judges', judges, 'Judge'), ('speakers', speakers, 'Speaker'), ('participants', participants, 'Participant'), ('partners', partners, 'Partner')]:
    output = ROOT / f'src/data/{filename}.ts'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(f"import type {{ {entity} }} from '../types/championship'\n\nexport const {filename} = "+json.dumps(records,ensure_ascii=False,indent=2)+f' as const satisfies readonly {entity}[]\n',encoding='utf8')

nomination_ids = ['nails','lash','pmu','smp','brows','hair']
step_ids = ['registration','preparation','submission','evaluation','results','awards']
for language, root in documents.items():
    about = root.one('#about')
    register = root.one('#register')
    form = root.one('.apply-form')
    success = root.one('.success')
    data = {
        'meta': {'title': text(root,'title'), 'description': next(n.attrs['content'] for n in root.all('meta') if n.attrs.get('name')=='description')},
        'nav': {a.attrs['href'].lstrip('#'):a.text() for a in root.one('.nav').all('a')},
        'hero': {'subtitle':text(root,'.hero__kicker'),'dates':text(root,'.hero__dates'),'nominations':text(root,'.hero__noms'),'register':root.one('.hero__actions').all('a')[0].text(),'judges':root.one('.hero__actions').all('a')[1].text()},
        'about': {'title':text(about,'h2'),'text':text(about,'.about__text'),'facts':{key:node.text() for key,node in zip(['nominations','judges','countries','format'],about.all('dt'))},'online':about.all('dd')[-1].text()},
        'nominations': {'title':text(root.one('#nominations'),'h2'),'items':{key:{'title':text(node,'h3'),'description':text(node,'p')} for key,node in zip(nomination_ids,root.all('.noms__item'))}},
        'process': {'title':text(root.one('#how'),'h2'),'lead':text(root,'.process__lead'),'steps':{key:{'title':text(node,'h3'),'description':text(node,'p')} for key,node in zip(step_ids,root.all('.process__step'))}},
        'judges': {'title':text(root.one('#judges'),'h2'),'filterLabel':root.one('.filter').attrs['aria-label'],'categories':{b.attrs['data-filter']:b.text() for b in root.all('.filter__btn')},'people':{}},
        'speakers': {'title':text(root.one('#speakers'),'h2'),'people':{}},
        'participants': {'title':text(root.one('#participants'),'h2'),'people':{}},
        'partners': {'title':text(root.one('#partners'),'h2'),'people':{'beauty-panda':{'label':text(root.one('.partner'),'.speaker__label'),'bio':text(root.one('.partner'),'.speaker__bio')}}},
        'registration': {'title':text(register,'h2'),'text':text(register,'.register__text'),'note':text(register,'.register__note'),'telegram':register.one('.register__actions').all('a')[0].text(),'instagram':register.one('.register__actions').all('a')[1].text()},
        'form': {'title':text(form,'h2'),'lead':text(form,'.modal__lead'),'name':form.all('.field')[0].one('label').text(),'country':form.all('.field')[1].one('label').text(),'role':text(form,'legend'),'roles':{n.one('input').attrs['value'].lower():n.one('span').text() for n in form.all('.choice')},'submit':text(form,'.form__submit'),'telegram':text(form,'.tg__text'),'success':text(success,'h3'),'successText':text(success,'.success__text')},
    }
    for node in root.all('.judge'):
        key=Path(node.one('img').attrs['src']).stem
        data['judges']['people'][key]={'role':text(node,'.judge__role'),'country':text(node,'.judge__country'),'bio':text(node,'.judge__bio')}
    for node in root.all('.speaker'):
        key=Path(node.one('img').attrs['src']).stem
        data['speakers']['people'][key]={'label':text(node,'.speaker__label'),'country':text(node,'.speaker__country'),'bio':text(node,'.speaker__bio'),'facts':{f'fact{i}':{'label':label.text(),'value':value.text()} for i,(label,value) in enumerate(zip(node.all('dt'),node.all('dd')))}}
    for node in root.all('.participant'):
        key=Path(node.one('img').attrs['src']).stem
        data['participants']['people'][key]={'country':text(node,'.participant__country')}
    data['ui'] = json.loads((ROOT/'scripts/locale-ui.json').read_text(encoding='utf8'))[language]
    write(ROOT/f'src/locales/{language}.json',data)

countries=sorted(set(text(n,'.judge__country') for n in english.all('.judge')))
print(json.dumps({'judges':len(judges),'speakers':len(speakers),'participants':len(participants),'countries':countries},ensure_ascii=False))
