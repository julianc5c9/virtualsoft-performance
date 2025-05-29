import http from 'k6/http'
import { check, group, sleep} from 'k6'
import { Gauge, Trend, Counter, Rate } from 'k6/metrics'

export const TrendMetricaInterna = Trend('MetricaInterna')
export const RateContentOK = Rate('ContentOK')
export const GaugeContentSize = Gauge('ContentSize')
export const CounterError = Counter('Errors')

export const options = {

    cloud: {
    projectID: 3759086,
    // Test runs with the same name groups test runs together
    name: 'Virtualsoft'
    }, 

    stages:[
        {duration: '20s', target:30},
        {duration: '10s', target: 20},
        {duration: '5s', target: 10}, 
    ],
    thresholds: {
        http_req_duration: ['p(99) < 1500'],
        http_req_failed: ['rate < 0.01'], // Menos del 1% de solicitudes deben fallar
        http_req_waiting: ['avg < 200'],
        http_req_sending: ['p(90) < 50'],
        http_reqs: ['count > 100'], // Debe haber más de 100 solicitudes totales

        //Threshold de las metricas 
        Errors: ['count < 10'],
        ContentSize: ['value < 115000'],
        ContentOK: ['rate < 0.95'],
        MetricaInterna: ['p(95)<250', 'p(90)<200', 'avg<150', 'med<100', 'min<50'],
    }
};

export default function(){
    const respuesta = http.get('https://qa.virtualcore.co/front/v1/')
    console.log(`El tamaño de la pagina es: ${respuesta.body.length}, bytes`)

    const contentOK = respuesta.json('texto') === 'Regístrate'
    const contentOK2 = respuesta.json('numero') === '2';

    TrendMetricaInterna.add(respuesta.timings.duration)
    RateContentOK.add(contentOK)
    RateContentOK.add(contentOK2)
    GaugeContentSize.add(respuesta.body.length)
    CounterError.add(contentOK || contentOK2)
   
    group('Validacion de status y contenido', () => {
        if(respuesta.status === 200) {
            check(respuesta, {
                'La pagina cargo correctamente: Status 200': (r) => r.status === 200})
            check(respuesta, {
                'El Texto Top juegos en America es verdadero': (r) => r.body.includes('Top juegos en America'),
                'El Texto Prueba de QA es falso': (r) => !r.body.includes('Prueba de QA'),   
            })
        } 
        if(respuesta.status === 404){
            check(respuesta, { 
            'El mensaje de error es correcto': (r) => r.error === 'Not Found',
            'El codigo de error es 404': (r) => r.code === 404,
            })
        }
    });

    group('Validacion de tamaño', () => {
        if(respuesta.body.length >= 100000) {
            check(respuesta, {'El tamaño de la pagina es mayor a 100000 bytes': (r) => r.body.length > 100000})
        }

        if(respuesta.body.length <= 100000) {
            check(respuesta, {
                'El tamaño de la pagina es menor a 100000 bytes': (r) => r.body.length < 100000})
        }
    })

    group('Validacion de tiempos de respuesta', () => {
        if(respuesta.status === 200) {
            check(respuesta, {
                'El tiempo de respuesta es menor a 20000ms': (r) => r.timings.duration < 400,
                'El tiempo de espera es menor a 2000ms': (r) => r.timings.waiting < 400,
                'El tiempo de envio es menor a 50ms': (r) => r.timings.sending < 50,
                'El tiempo de recepcion es menor a 100ms': (r) => r.timings.receiving < 100,
            })
        }
    })

    group('Validaciones adicionales', () => {
        
        if(respuesta.headers['Content-Type'] === true) {
            check(respuesta, {
                'Content-Type es application/json': (r) => r.headers['Content-Type'] === 'application/json'})
        }
        if(!respuesta.body.includes('<nav></nav>')) {
            check(respuesta, {
                'La pagina no contiene elemento de navegacion': (r) => !r.body.includes('<nav></nav>')})
        }  
    })    

    sleep(1);
}