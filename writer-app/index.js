import fsp from 'bare-fs/promises'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'

const store = new Corestore(Pear.config.storage);

const swarm = new Hyperswarm()
Pear.teardown(() => swarm.destroy())

swarm.on('connection', conn => store.replicate(conn))


const core = store.get({ name: 'my-bee-core1'});

const bee = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'utf-8'
})

// core.key and core.discoveryKey will only be set after core.ready resolves
await core.ready()

const discovery = swarm.join(core.discoveryKey)

discovery.flushed().then(()=> {
    console.log('bee key:', b4a.toString(core.key, 'hex'))
})

if(core.length <=1) {
    console.log("importing dict...");
    const dict = JSON.parse(await fsp.readFile('./dict.json'))
    const batch = bee.batch();
    for(const { key, value} of dict) {
        await batch.put(key, value)
    }
    await batch.flush();
} else {
    console.log("sending dict ", core.length)
}