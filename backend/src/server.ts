// src/server.ts - Backend Server Entrypoint

import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 TransitOps Control Center ERP Server Booted Successfully!`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🔒 Authentication: Clerk Node SDK Active`);
    console.log(`🛡️  RBAC Authorization Enforcements Loaded`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
});

export default server;
