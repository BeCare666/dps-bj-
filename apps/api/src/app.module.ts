import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganisationsModule } from './organisations/organisations.module.js';
import { GrillesModule } from './grilles/grilles.module.js';
import { SessionsEvaluationModule } from './sessions-evaluation/sessions-evaluation.module.js';
import { AbonnementsModule } from './abonnements/abonnements.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { AlertesModule } from './alertes/alertes.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { TypesEiModule } from './types-ei/types-ei.module.js';
import { EvenementsIndesirablesModule } from './evenements-indesirables/evenements-indesirables.module.js';
import { PaiementsModule } from './paiements/paiements.module.js';
import { FormationsModule } from './formations/formations.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    AuthModule,
    OrganisationsModule,
    GrillesModule,
    SessionsEvaluationModule,
    AbonnementsModule,
    PatientsModule,
    AlertesModule,
    CloudinaryModule,
    TypesEiModule,
    EvenementsIndesirablesModule,
    PaiementsModule,
    FormationsModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
