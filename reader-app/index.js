import path from 'bare-path'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import hyperbee from 'hyperbee'
import Pipe from 'bare-pipe'
import b4a from 'b4a'

const key = Pear.config.args[0]

if(!key) throw new Error('provide a key')
    
const store = new Corestore(Pear.config.storage)

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

swarm.on('connection', (conn) => store.replicate(conn))

const core = store.get({ key: b4a.from(key, 'hex')});

const bee = new hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'utf-8'
})

await core.ready();

console.log('core key here is: ', core.key.toString('hex'));

swarm.join(core.discoveryKey)

const stdin = new Pipe(0);

stdin.on('data', (data)=>{
    const word = data.toString().trim();
    if(!word.length) return;
    bee.get(word).then(node => {
        if(!node || !node.value) console.log(`No dictionary entry for ${word}`, node);
        else console.log(`${word} -> ${node.value}`);
        setImmediate(console.log)
    }, console.error)
})