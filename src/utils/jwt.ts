import type { I18nTranslations, JWTPayload } from '@types';

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';

/**
 * Options for the verifyJWT function
 */
interface Options {
	/** The JWT token to verify */
	token: string;
	/** The JWT service used to verify the token validity */
	jwtService: JwtService;
	/** The Config service used to retrieve the JWT secret */
	configService: ConfigService;
	/** The i18n service used to translate errors */
	i18nService: I18nService<I18nTranslations>;
}

/**
 * Determine if the given JWT token is valid
 * @returns {JWTPayload} JWT payload
 *
 * @throws {UnauthorizedException} If the token is invalid
 * @throws {UnauthorizedException} If the token is expired
 */
export function verifyJWT({ token, jwtService, configService, i18nService }: Options): JWTPayload | never {
	const bearer = token.replace('Bearer', '').trim();

	try {
		return jwtService.verify<JWTPayload>(bearer, { secret: configService.get<string>('auth.jwtKey') });
	} catch (err) {
		const error = err as Error;
		if (error.name === 'TokenExpiredError') throw new UnauthorizedException(Errors.JWT.Expired({ i18n: i18nService }));
		if (error.name === 'JsonWebTokenError') throw new UnauthorizedException(Errors.JWT.Invalid({ i18n: i18nService }));

		/* istanbul ignore next-line */
		throw new UnauthorizedException(Errors.JWT.Unknown({ i18n: i18nService }));
	}
}
