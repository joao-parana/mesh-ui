import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs/Observable';
import { Notification } from 'gentics-ui-core';

import { ApiService } from '../../../core/providers/api/api.service';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { I18nNotification } from '../../../core/providers/i18n-notification/i18n-notification.service';
import { ProjectAssignments } from '../../../state/models/admin-schemas-state.model';
import { AdminSchemaEffectsService } from './admin-schema-effects.service';
import { TestApplicationState } from '../../../state/testing/test-application-state.mock';
import { ConfigService } from '../../../core/providers/config/config.service';
import { MockConfigService } from '../../../core/providers/config/config.service.mock';

describe('AdminSchemaEffects', () => {
    let adminSchemaEffects: AdminSchemaEffectsService;
    let state: TestApplicationState;
    let apiServiceSpy;
    let i18nNotificationSpy;

    beforeEach(() => {
        apiServiceSpy = {
            project : {
                getProjects: jasmine.createSpy('getProject'),
                getProjectSchemas: jasmine.createSpy('getProjectSchemas')
            }
        };
        i18nNotificationSpy = jasmine.createSpyObj('i18n notifications', ['show']);


        TestBed.configureTestingModule({
            providers: [
                AdminSchemaEffectsService,
                { provide: ApiService, useValue: apiServiceSpy},
                { provide: ApplicationStateService, useClass: TestApplicationState },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: I18nNotification, useValue: i18nNotificationSpy},
                { provide: Notification, useValue: {}}
            ]
        });

        state = TestBed.get(ApplicationStateService);
        adminSchemaEffects = TestBed.get(AdminSchemaEffectsService);

        state.trackAllActionCalls();
    });

    describe('loadEntityAssignments', () => {
        const projects = {
            data: [
                {uuid: 'uuid1', name: 'project1'},
                {uuid: 'uuid2', name: 'project2'}
            ]
        };

        it('sends empty object on no projects', () => {
            apiServiceSpy.project.getProjects.and.returnValue(Observable.of({data: []}));
            adminSchemaEffects.loadEntityAssignments('schema', 'test');
            expect(state.actions.adminSchemas.fetchEntityAssignmentProjectsSuccess).toHaveBeenCalled();
            expect(state.actions.adminSchemas.fetchEntityAssignmentsSuccess).toHaveBeenCalledWith({});
        });

        it('returns correct assignments 1', () => {
            const expected: ProjectAssignments = {
                uuid1: true,
                uuid2: true
            };

            apiServiceSpy.project.getProjects.and.returnValue(Observable.of(projects));
            apiServiceSpy.project.getProjectSchemas.and.returnValue(Observable.of(schemasResponse(['test'])));
            adminSchemaEffects.loadEntityAssignments('schema', 'test');
            expect(state.actions.adminSchemas.fetchEntityAssignmentProjectsSuccess).toHaveBeenCalled();
            expect(state.actions.adminSchemas.fetchEntityAssignmentsSuccess).toHaveBeenCalledWith(expected);
        });

        it('returns correct assignments 2', () => {
            const expected: ProjectAssignments = {
                uuid1: false,
                uuid2: true
            };

            apiServiceSpy.project.getProjects.and.returnValue(Observable.of(projects));
            apiServiceSpy.project.getProjectSchemas.and.returnValues(
                Observable.of(schemasResponse([])),
                Observable.of(schemasResponse(['test']))
            );
            adminSchemaEffects.loadEntityAssignments('schema', 'test');
            expect(state.actions.adminSchemas.fetchEntityAssignmentProjectsSuccess).toHaveBeenCalled();
            expect(state.actions.adminSchemas.fetchEntityAssignmentsSuccess).toHaveBeenCalledWith(expected);
        });

        it('returns correct assignments 3', () => {
            const expected: ProjectAssignments = {
                uuid1: false,
                uuid2: false
            };

            apiServiceSpy.project.getProjects.and.returnValue(Observable.of(projects));
            apiServiceSpy.project.getProjectSchemas.and.returnValue(Observable.of(schemasResponse([])));
            adminSchemaEffects.loadEntityAssignments('schema', 'test');
            expect(state.actions.adminSchemas.fetchEntityAssignmentProjectsSuccess).toHaveBeenCalled();
            expect(state.actions.adminSchemas.fetchEntityAssignmentsSuccess).toHaveBeenCalledWith(expected);
        });

        function schemasResponse(projectUuids: string[]) {
            return {
                data: projectUuids.map(uuid => ({uuid}))
            };
        }
    });
});
