import datetime
import bottle
import hashids
import modules.cherry_bottle_server as cherry_bottle


class TestBackEnd(cherry_bottle.WebApp):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.sess_hash_alpha = '0123456789ABCDEFHJKMNPRTVWXYZ'
        self.session_hash_func = hashids.Hashids(
            alphabet= self.sess_hash_alpha, salt= 'bwmt_session')
        self.entry_hash_func = hashids.Hashids(salt= 'bwmt_entry')
        self.required_entry_fields = [
            'entry_id',
            'session_id',
            #need a bunch more, add once spec is finalized
        ]
        self.locale_dt_fmt = '%Y-%m-%d %H:%M:%S'

        @self.app.get('/sessions')
        @cherry_bottle.json_head
        def get_persisted_sessions():
            data = self.magpy.db.mongo.tmp.bwmt_sessions.find(
                {},
                {'_id': 0}
            )
            return {'sessions': [sess for sess in data]}

        @self.app.post('/new_session')
        @cherry_bottle.json_head
        def create_new_session():
            use_server_ts = False
            warnings = []
            try:
                desc = bottle.request.json['description']
            except KeyError:
                warnings.append('Missing expected "description" field.')
                desc = ''
            try:
                ts = int(bottle.request.json['timestamp'])
            except KeyError:
                warnings.append('Missing expected "timestamp" field.')
                use_server_ts = True
            except ValueError:
                warnings.append(
                    'Expected numeric data in "timestamp" field.')
                use_server_ts = True
            if use_server_ts:
                ts = int(datetime.datetime.now().timestamp() * 1000)
            dt_str = datetime.datetime.now().strftime(self.locale_dt_fmt)
            session = {
                'session_id': self.session_hash_func.encode(ts),
                'created_ts': ts,
                'created_string': dt_str,
                'entry_count': 0,
                'description': desc,
                'last_modified_ts': ts,
                'last_modified_string': dt_str
            }
            _ = self.magpy.db.mongo.tmp.bwmt_sessions.insert_one(session)
            if _.acknowledged:
                try:
                    del session['_id']
                except KeyError:
                    pass
                return {
                    'status': 'success',
                    'reason': None,
                    'new_session': session,
                    'warnings': warnings
                }
            else:
                return {
                    'status': 'failure',
                    'reason': 'Database failed to insert the document.',
                    'warnings': warnings
                }

        @self.app.get('/entries/<session_id>')
        @cherry_bottle.json_head
        def get_session(session_id):
            data = self.magpy.db.mongo.tmp.bwmt_entries.find(
                {'session_id': session_id}
            )
            return {
                'session_id': session_id,
                'entries': [ent for ent in data]
            }

        @self.app.post('/entries')
        @cherry_bottle.json_head
        def add_or_update_entry():
            try:
                e_id = bottle.request.json['entry_id']
            except KeyError:
                return {
                    'status': 'failure',
                    'reason': 'Malformed entry - no entry_id found.'
                }
            val = self.validate_entry(bottle.request.json)
            if not val['is_valid']:
                return {
                    'status': 'failure',
                    'reason': val['err']
                }
            if self.magpy.db.mongo.tmp.bwmt_entries.find_one(
                {'entry_id': e_id}
            ) is None:
                ent = {fld: bottle.request.json[fld] for fld
                    in bottle.request.json}
                self.process_raw_entry(ent)
                self.magpy.db.mongo.tmp.bwmt_entries.insert_one(ent)
                return {
                    'status': 'success',
                    'is_new': False,
                    'entry': ent
                }
            else:
                #entry already exists, record a diff and update
                pass

    def validate_entry(self, data):
        for fld in self.required_entry_fields:
            if fld not in data:
                return {
                    'is_valid': False,
                    'reason': 'Missing required field - {0}.'.format(fld)
                }
        else:
            return {
                'is_valid': True,
                'reason': None
            }

    def process_raw_entry(self, entry):
        pass
        #need to do things like get the total weight and also set the largest
        entry['total'] = self.sum_nullable(entry['walleyes'])

    @staticmethod
    def sum_nullable(coll):
        t = 0
        for i in coll:
            try:
                t += i
            except TypeError:
                pass
        return t

app_root = '/bwmt/'
app_name = 'testbackend'
app_obj = TestBackEnd
