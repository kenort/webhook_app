export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Health check
        if (request.method === 'GET' && url.pathname === '/') {
            return new Response('Webhook activo 🚀', { status: 200 });
        }

        // Solo POST /webhook
        if (request.method !== 'POST' || url.pathname !== '/webhook') {
            return new Response('Not Found', { status: 404 });
        }

        let payload;

        try {
            payload = await request.json();
        } catch (error) {
            return new Response(
                JSON.stringify({ ok: false, message: 'JSON inválido' }),
                { status: 400 }
            );
        }


        if (!payload.type) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'Payload inválido: falta type'
                }),
                { status: 400 }
            );
        }


        let gasUrl;

        switch (payload.type) {
            case 'form_orden_trabajo':
                gasUrl = env.GAS_URL_OT;
                break;

            case 'form_asignacion_clave':
                gasUrl = env.GAS_URL_CLAVES;
                break;

            default:
                return new Response(
                    JSON.stringify({
                        ok: false,
                        message: 'Tipo de formulario no reconocido'
                    }),
                    { status: 400 }
                );
        }


        ctx.waitUntil(
            fetch(gasUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(() => {
                    console.log(`✅ Datos enviados a GAS (${payload.type})`);
                })
                .catch(err => {
                    console.error('❌ Error enviando datos a GAS:', err);
                })
        );


        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Datos recibidos correctamente, procesando...'
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
