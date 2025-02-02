import { Observable } from 'rxjs/Observable';

import { GenericMessageResponse, UserResponse } from '../../../common/models/server-models';

import { ApiBase, ResponseMap } from './api-base.service';
import { ApiError } from './api-error';

export class AuthApi {
    constructor(private apiBase: ApiBase) {}

    /** Query information about the current user. */
    getCurrentUser(): Observable<UserResponse> {
        return this.apiBase.get('/auth/me', {});
    }

    /** Check if the user has an active valid JWT session. */
    isLoggedIn(): Observable<boolean> {
        return this.apiBase.get('/auth/me', {}).mapResponses({
            success: true,
            401: false
        } as ResponseMap<
            {
                200: UserResponse;
            },
            boolean
        >);
    }

    /** Login as a known user. */
    login({
        username,
        password,
        newPassword
    }: {
        username: string;
        password: string;
        newPassword?: string;
    }): Observable<boolean | ApiError> {
        return this.apiBase.post('/auth/login', undefined, { username, password, newPassword }).mapResponses({
            success: true,
            400: err => err
        } as ResponseMap<
            {
                200: GenericMessageResponse;
                400: ApiError;
            },
            boolean | ApiError
        >);
    }

    /** Log out and destroy the current session. */
    logout(): Observable<boolean> {
        return this.apiBase.get('/auth/logout', {}).mapResponses({
            success: true,
            401: false
        } as ResponseMap<
            {
                200: GenericMessageResponse;
            },
            boolean
        >);
    }

    public refreshToken(): Observable<any> {
        return this.apiBase.get(`/auth/me`, {
            fields: 'uuid'
        });
    }
}
