return {
	tasks = {
		{
			name = "backend",
			exec = "cargo watch -x run",
		},
		{
			name = "frontend",
			exec = "pnpm run dev",
			working_dir = "web/src-web",
		},
	},
}
