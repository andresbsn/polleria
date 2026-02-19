try {
    const axios = require('axios');
    console.log('Axios loaded successfully');
    console.log('Axios version:', require('axios/package.json').version);
} catch (e) {
    console.error('Error loading axios:', e.message);
    process.exit(1);
}
