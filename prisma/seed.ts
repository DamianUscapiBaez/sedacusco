// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Crear permisos básicos
  await prisma.permission.createMany({
    data: [
      // Modulo de Lotes
      { key: 'lots.manage', name: 'Gestión de Lotes', description: 'Administrar lotes del sistema' },
      { key: 'lots.create', name: 'Crear Lotes', description: 'Crear nuevas lotes' },
      { key: 'lots.update', name: 'Editar Lotes', description: 'Modificar lotes existentes' },
      { key: 'lots.delete', name: 'Eliminar Lotes', description: 'Eliminar lotes del sistema' },
      // Módulo de Roles
      { key: 'roles.manage', name: 'Gestión de Usuarios', description: 'Administrar roles del sistema' },
      { key: 'roles.create', name: 'Crear Usuarios', description: 'Crear nuevos roles' },
      { key: 'roles.update', name: 'Editar Usuarios', description: 'Modificar roles existentes' },
      { key: 'roles.delete', name: 'Eliminar Usuarios', description: 'Eliminar roles del sistema' },
      // Módulo de Usuarios
      { key: 'users.manage', name: 'Gestión de Usuarios', description: 'Administrar usuarios del sistema' },
      { key: 'users.create', name: 'Crear Usuarios', description: 'Crear nuevos usuarios' },
      { key: 'users.update', name: 'Editar Usuarios', description: 'Modificar usuarios existentes' },
      { key: 'users.delete', name: 'Eliminar Usuarios', description: 'Eliminar usuarios del sistema' },
      // Módulo de Rotulado
      { key: 'labeled.manage', name: 'Gestión Rotulado', description: 'Administrar rotulado' },
      { key: 'labeled.create', name: 'Crear Rotulado', description: 'Crear nuevos rotulado' },
      { key: 'labeled.update', name: 'Editar Rotulado', description: 'Modificar rotulado' },
      { key: 'labeled.delete', name: 'Eliminar Rotulado', description: 'Eliminar rotulado' },
      // Módulo de Tecnicos
      { key: 'technician.manage', name: 'Gestión Tecnico', description: 'Administrar tecnicos' },
      { key: 'technician.create', name: 'Crear Tecnicos', description: 'Crear nuevos tecnicos' },
      { key: 'technician.update', name: 'Editar Tecnicos', description: 'Modificar tecnicos' },
      { key: 'technician.delete', name: 'Eliminar Tecnicos', description: 'Eliminar tecnicos' },
      // Módulo de Actas
      { key: 'acts.manage', name: 'Gestión de Actas', description: 'Administrar actas del sistema' },
      { key: 'acts.create', name: 'Crear Actas', description: 'Crear nuevas actas' },
      { key: 'acts.update', name: 'Editar Actas', description: 'Modificar actas existentes' },
      { key: 'acts.delete', name: 'Eliminar Actas', description: 'Eliminar actas del sistema' },
      // Módulo de Precatastrales
      { key: 'precatastral.manage', name: 'Gestión Precatastral', description: 'Administrar precatastrales' },
      { key: 'precatastral.create', name: 'Crear Precatastrales', description: 'Crear nuevos precatastrales' },
      { key: 'precatastral.update', name: 'Editar Precatastrales', description: 'Modificar precatastrales' },
      { key: 'precatastral.delete', name: 'Eliminar Precatastrales', description: 'Eliminar precatastrales' },
      // Módulo de Reportes
      { key: 'reports.generate', name: 'Generar Reportes', description: 'Generar reportes del sistema' },
    ],
    skipDuplicates: true,
  });

  // 2. Crear roles básicos
  await prisma.lot.create({
    data: {
      name: 'Lote 1',
      start_date: new Date('2024-02-24'),
      end_date: new Date('2024-03-24'),
      status: 'INACTIVE'
    }
  });

  await prisma.lot.create({
    data: {
      name: 'Lote 2',
      start_date: new Date('2024-03-24'),
      end_date: new Date('2024-04-24'),
      status: 'ACTIVE'
    }
  });

  // 2. Crear roles básicos
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrador',
      description: 'Acceso completo al sistema.',
    }
  });

  // También actualiza el nombre y descripción del rol para que sea más claro
  const digitadorRole = await prisma.role.create({
    data: {
      name: 'Digitador',
      description: 'Puede crear y ver actas y precatastrales.',
    }
  });

  // También actualiza el nombre y descripción del rol para que sea más claro
  const almaceneroRole = await prisma.role.create({
    data: {
      name: 'Almacenero',
      description: 'Puede administrar solo labeled.',
    }
  });


  // 3. Asignar permisos a roles
  // Administrador - todos los permisos
  const allPermissions: { id: number }[] = await prisma.permission.findMany();
  await prisma.rolePermission.createMany({
    data: allPermissions.map(p => ({
      roleId: adminRole.id,
      permissionId: p.id,
    }))
  });

  // Modifica la parte de asignación de permisos al rol Digitador
  const digitadorPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        // Permisos para Actas
        { key: { in: ['acts.read', 'acts.create'] } },
        // Permisos para Precatastrales
        { key: { in: ['precatastral.read', 'precatastral.create'] } },
        // Permiso básico para el dashboard
        { key: 'dashboard.access' }
      ]
    }
  });

  await prisma.rolePermission.createMany({
    data: digitadorPermissions.map(p => ({
      roleId: digitadorRole.id,
      permissionId: p.id,
    }))
  });

  const almaceneroPermission = await prisma.permission.findMany({
    where: {
      OR: [
        // Permisos para Actas
        { key: { in: ['labeled.read', 'labeled.create', 'labeled.update'] } },
        // Permiso básico para el dashboard
        { key: 'dashboard.access' }
      ]
    }
  });

  await prisma.rolePermission.createMany({
    data: almaceneroPermission.map(p => ({
      roleId: almaceneroRole.id,
      permissionId: p.id,
    }))
  });


  // 4. Crear usuario administrador
  const adminPassword = await hash('Poppies090301', 10);
  await prisma.user.create({
    data: {
      names: "Damian Uscapi",
      username: 'admin',
      password: adminPassword,
      status: 'ACTIVE',
      role: {
        connect: {
          id: adminRole.id
        }
      }
    }
  });

  // 5. Crear técnicos de ejemplo
  // const technician1 = await prisma.technician.create({
  //   data: {
  //     dni: '12345678',
  //     name: 'Juan Pérez',
  //   }
  // });

  // const technician2 = await prisma.technician.create({
  //   data: {
  //     dni: '87654321',
  //     name: 'María García',
  //   }
  // });

  // 6. Crear clientes de ejemplo
  // const customer1 = await prisma.customer.create({
  //   data: {
  //     inscription: '012345678',
  //     address: 'Calle Principal 123',
  //     customer_name: 'Cliente Ejemplo 1',
  //     old_meter: 'MET-001',
  //     observation: 'Cliente preferencial'
  //   }
  // });

  // const customer2 = await prisma.customer.create({
  //   data: {
  //     inscription: '098745632',
  //     address: 'Avenida Central 456',
  //     customer_name: 'Cliente Ejemplo 2',
  //     old_meter: 'MET-002',
  //     observation: 'Cliente preferencial'
  //   }
  // });

  // const customer3 = await prisma.customer.create({
  //   data: {
  //     inscription: '098745633',
  //     address: 'Avenida Central 456',
  //     customer_name: 'Cliente Ejemplo 3',
  //     old_meter: 'MET-003',
  //     observation: 'Nuevo cliente'
  //   }
  // });
  // const customer4 = await prisma.customer.create({
  //   data: {
  //     inscription: '098745631',
  //     address: 'Avenida Central 456',
  //     customer_name: 'Cliente Ejemplo 4',
  //     old_meter: 'MET-004',
  //     observation: 'Nuevo cliente'
  //   }
  // });

  // 7. Crear medidores de ejemplo
  // const meter1 = await prisma.meterRenovation.create({
  //   data: {
  //     meter_number: 'DA24000001',
  //     verification_code: 'VC001'
  //   }
  // });

  // const meter2 = await prisma.meterRenovation.create({
  //   data: {
  //     meter_number: 'DA24000002',
  //     verification_code: 'VC002'
  //   }
  // });
  // const meter3 = await prisma.meterRenovation.create({
  //   data: {
  //     meter_number: 'DA24000003',
  //     verification_code: 'VC003'
  //   }
  // });
  // const meter4 = await prisma.meterRenovation.create({
  //   data: {
  //     meter_number: 'DA24000004',
  //     verification_code: 'VC004'
  //   }
  // });
  // 8. Crear actas de ejemplo
  // const act1 = await prisma.act.create({
  //   data: {
  //     lot: '1',
  //     file_number: '1001',
  //     file_date: new Date("2025-04-11"), // Replace with a valid ISO 8601 date string
  //     file_time: new Date().toISOString(),
  //     meterrenovation_id: meter1.id,
  //     reading: '129',
  //     rotating_pointer: 'SI',
  //     meter_security_seal: 'SI',
  //     reading_impossibility_viewer: 'NO',
  //     customer_id: customer1.id,
  //     technician_id: technician1.id,
  //     created_by: adminUser.id,
  //     observations: 'SIN OBSERVACIONES',
  //   }
  // });

  // await prisma.actHistory.create({
  //   data: {
  //     action: 'CREATE',
  //     details: `Se creó la ficha con número: ${act1.file_number}`,
  //     act_id: act1.id,
  //     updated_by: adminUser.id
  //   }
  // });

  // const act2 = await prisma.act.create({
  //   data: {
  //     lot: '2',
  //     file_number: '1002',
  //     file_date: new Date("2025-04-11"), // Replace with a valid ISO 8601 date string
  //     file_time: new Date().toISOString(),
  //     reading: '541',
  //     meterrenovation_id: meter2.id,
  //     rotating_pointer: 'NO',
  //     meter_security_seal: 'SI',
  //     reading_impossibility_viewer: 'NO',
  //     customer_id: customer2.id,
  //     technician_id: technician2.id,
  //     created_by: adminUser.id,
  //     observations: 'SIN OBSERVACIONES',
  //   }
  // });

  // await prisma.actHistory.create({
  //   data: {
  //     action: 'CREATE',
  //     details: `Se creó la ficha con número: ${act2.file_number}`,
  //     act_id: act2.id,
  //     updated_by: adminUser.id
  //   }
  // });

  // 9. Crear precatastrales de ejemplo
  // const precatastral1 = await prisma.preCatastrals.create({
  //   data: {
  //     file_number: '2001',
  //     property: 'DOMESTICO',
  //     located_box: 'EXTERIOR',
  //     buried_connection: 'NO',
  //     has_meter: 'SI',
  //     reading: '12345',
  //     has_cover: 'SI',
  //     cover_state: 'BUENO',
  //     has_box: 'SI',
  //     box_state: 'BUENO',
  //     keys: '2',
  //     cover_material: 'METAL',
  //     is_located: 'SI',
  //     customer_id: customer1.id,
  //     technician_id: technician1.id,
  //     observations: 'SIN OBSERVACIONES',
  //   }
  // });
  // await prisma.preCatastralHistory.create({
  //   data: {
  //     action: 'CREATE',
  //     details: `Se creó la ficha con número: ${precatastral1.file_number}`,
  //     preCatastral_id: precatastral1.id,
  //     updated_by: adminUser.id
  //   }
  // });
  // const precatastral2 = await prisma.preCatastrals.create({
  //   data: {
  //     file_number: '2002',
  //     property: 'COMERCIAL',
  //     located_box: 'INTERIOR',
  //     buried_connection: 'SI',
  //     has_meter: 'SI',
  //     reading: '54321',
  //     has_cover: 'SI',
  //     cover_state: 'MALO',
  //     has_box: 'NO',
  //     box_state: 'MALO',
  //     keys: '1',
  //     cover_material: 'PLASTICO',
  //     is_located: 'SI',
  //     customer_id: customer2.id,
  //     technician_id: technician2.id,
  //     observations: 'SIN OBSERVACIONES',
  //   }
  // });
  // await prisma.preCatastralHistory.create({
  //   data: {
  //     action: 'CREATE',
  //     details: `Se creó la ficha con número: ${precatastral2.file_number}`,
  //     preCatastral_id: precatastral2.id,
  //     updated_by: adminUser.id
  //   }
  // });

  console.log('✅ Datos iniciales creados exitosamente!');
  console.log('----------------------------------------');
  console.log('👤 Usuario administrador:');
  console.log(`   Username: admin`);
  console.log(`   Password: Poppies090301`);
  console.log('----------------------------------------');
  console.log('📊 Datos creados:');
  console.log(`   - ${allPermissions.length} permisos`);
  console.log(`   - 3 roles (Administrador, Técnico, Almacenero)`);
}

main()
  .catch(e => {
    console.error('❌ Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });