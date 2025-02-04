import * as pkg from '../../package.json';
import { APIEndpointVersion, type HTTPOptions, type JSPClientOptions } from '../types/Client.ts';
import type { AccessOptions } from '../types/request/document/AccessOptions';
import type { EditOptions } from '../types/request/document/EditOptions';
import type { PublishOptions } from '../types/request/document/PublishOptions';
import type { RemoveOptions } from '../types/request/document/RemoveOptions';
import type { AccessedDocument } from '../types/response/AccessedDocument';
import type { PublishedDocument } from '../types/response/PublishedDocument';
import { HTTP } from './HTTP';

export class Client {
	private static readonly defaultHTTPOptions: HTTPOptions = {
		headers: {
			'User-Agent': `JSPasteHeadless/${pkg.version} (https://github.com/jspaste/library)`
		},
		retries: 3,
		timeout: 10000
	};

	private static readonly defaultJSPOptions: JSPClientOptions = {
		api: 'https://jspaste.eu/api',
		version: APIEndpointVersion.v2,
		http: Client.defaultHTTPOptions
	};

	private http: HTTP;
	private readonly options: JSPClientOptions;
	private readonly endpoint: string;

	public constructor(options: Partial<JSPClientOptions> = {}) {
		this.options = { ...Client.defaultJSPOptions, ...options };
		this.endpoint = `${this.options.api}/v${this.options.version}`;

		this.http = new HTTP({ ...Client.defaultHTTPOptions, ...this.options.http });
	}

	public async access(key: string, options?: AccessOptions) {
		const passwordHeader = options?.password ? { password: options.password } : undefined;

		return this.http.fetch<AccessedDocument>(`${this.endpoint}/documents/${key}`, {
			method: 'GET',
			headers: {
				...passwordHeader
			}
		});
	}

	public async publish(data: any, options?: PublishOptions) {
		const keyHeader = options?.key ? { key: options.key } : undefined;
		const keyLengthHeader = options?.keyLength ? { keyLength: options.keyLength } : undefined;
		const secretHeader = options?.secret ? { secret: options.secret } : undefined;
		const passwordHeader = options?.password ? { password: options.password } : undefined;
		const lifetimeHeader = options?.lifetime ? { lifetime: options.lifetime } : undefined;

		return this.http.fetch<PublishedDocument>(`${this.endpoint}/documents`, {
			method: 'POST',
			body: data,
			headers: {
				...keyHeader,
				...keyLengthHeader,
				...secretHeader,
				...passwordHeader,
				...lifetimeHeader
			}
		});
	}

	public async exists(key: string) {
		if (this.options.version < APIEndpointVersion.v2) {
			throw new Error('"Exists" can only be used with API version 2 or higher.');
		}

		return this.http.fetch<boolean>(`${this.endpoint}/documents/${key}/exists`, {
			method: 'GET'
		});
	}

	public async edit(key: string, options: EditOptions) {
		if (this.options.version < APIEndpointVersion.v2) {
			throw new Error('"Edit" can only be used with API version 2 or higher.');
		}

		const secretHeader = options?.secret ? { secret: options.secret } : undefined;

		return this.http.fetch<{ edited: boolean }>(`${this.endpoint}/documents/${key}`, {
			method: 'PATCH',
			body: options.newBody,
			headers: {
				...secretHeader
			}
		});
	}

	public async remove(key: string, options: RemoveOptions) {
		const secretHeader = options?.secret ? { secret: options.secret } : undefined;

		return this.http.fetch<{ removed: boolean }>(`${this.endpoint}/documents/${key}`, {
			method: 'DELETE',
			headers: {
				...secretHeader
			}
		});
	}
}
