.PHONY: install test demo json clean

install:
	python3 -m venv .venv
	. .venv/bin/activate && pip install -e ".[dev]"

test:
	. .venv/bin/activate && pytest

demo:
	. .venv/bin/activate && pdm-run examples/patients/pneumonia_case_001.json --memory-dir examples/memory

json:
	. .venv/bin/activate && pdm-run examples/patients/pneumonia_case_001.json --json

clean:
	rm -rf .pytest_cache src/*.egg-info build dist
	find . -name __pycache__ -type d -prune -exec rm -rf {} +

