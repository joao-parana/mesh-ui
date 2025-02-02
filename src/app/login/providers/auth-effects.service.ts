import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { UserResponse } from 'src/app/common/models/server-models';

import { ApiError } from '../../core/providers/api/api-error';
import { ApiService } from '../../core/providers/api/api.service';
import { ConfigService } from '../../core/providers/config/config.service';
import { ApplicationStateService } from '../../state/providers/application-state.service';

@Injectable()
export class AuthEffectsService {
    constructor(
        private api: ApiService,
        private state: ApplicationStateService,
        private config: ConfigService,
        private router: Router
    ) {}

    changePassword(userUuid: string, password: string): Promise<void> {
        this.state.actions.auth.changePasswordStart();
        return this.api.admin
            .updateUser({ userUuid }, { password })
            .toPromise()
            .then(
                user => {
                    this.state.actions.auth.changePasswordSuccess();
                },
                error => {
                    // TODO Provide some error message or toast and add some generic error handler
                    this.state.actions.auth.changePasswordError();
                }
            );
    }

    login(username: string, password: string, newPassword?: string): Promise<UserResponse> {
        this.state.actions.auth.loginStart();
        return this.api.auth
            .login({ username, password, newPassword })
            .flatMap(response => {
                if (typeof response === 'boolean') {
                    return this.api.auth.getCurrentUser();
                } else if (response && response.i18nKey) {
                    throw response;
                } else {
                    return [];
                }
            })
            .do(
                user => {
                    if (!user || user.username === this.config.ANONYMOUS_USER_NAME) {
                        this.state.actions.auth.loginError();
                    } else {
                        this.state.actions.auth.loginSuccess(user);
                    }
                },
                error => {
                    this.state.actions.auth.loginError();
                    throw error;
                }
            )
            .toPromise();
    }

    logout(): void {
        this.state.actions.auth.logoutStart();
        this.api.auth.logout().subscribe(
            successful => {
                if (successful) {
                    this.state.actions.auth.logoutSuccess();
                    this.router.navigate(['/login']);
                } else {
                    this.state.actions.auth.logoutError();
                }
            },
            error => {
                this.state.actions.auth.logoutError();
                // TODO: Add general error handler
                throw error;
            }
        );
    }

    /** Check if the user has an active authenticated session already */
    validateSession(): void {
        this.state.actions.auth.loginStart();

        this.api.auth.getCurrentUser().subscribe(user => {
            if (user.username === this.config.ANONYMOUS_USER_NAME) {
                this.state.actions.auth.loginError();
            } else {
                this.state.actions.auth.loginSuccess(user);
            }
        });
    }
}
