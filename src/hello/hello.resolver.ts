import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HelloResolver {
	@Query((returns) => String)
	public async hello() {
		return 'Hello World !';
	}
}
