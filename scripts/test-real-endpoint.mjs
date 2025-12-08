
import FormData from 'form-data';

const ENDPOINT = 'https://engine03.frconnect.com.br/webhook/frsend.consultar.placa';

// A minimal valid JPEG image (1x1 pixel)
const base64Image = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/igAoAKACgD/2Q==';

async function testEndpoint() {
    try {
        console.log('Preparing to send request to:', ENDPOINT);

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Image, 'base64');

        // Check if global fetch exists (Node 18+)
        if (typeof fetch === 'undefined') {
            throw new Error('Global fetch not available. Use Node.js 18+');
        }

        console.log('Sending POST request...');

        const response = await fetch(ENDPOINT, {
            method: 'POST',
            body: buffer,
            headers: {
                'Content-Type': 'image/jpeg'
            }
        });

        console.log(`Response status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log('Response body:', text);

        if (response.ok) {
            console.log('SUCCESS: Endpoint accepted the request.');
        } else {
            console.error('FAILURE: Endpoint rejected request.');
        }

    } catch (error) {
        console.error('ERROR calling endpoint:', error);
    }
}

testEndpoint();
