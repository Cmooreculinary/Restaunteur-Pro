# Wave 4 — AllergenShield

Status: GATED. DO NOT SHIP. DO NOT MARK LIVE.

## Hard gates (both must clear before any production release)
1. **Liability opinion** — written legal opinion on allergen detection liability
2. **Product insurance** — food-tech product liability policy in place

## What to do now (architecture only)

### Validate sub-100ms deterministic core
```bash
# Run perf test on allergen matching logic
python3 -m pytest tests/test_allergen_core.py -v --tb=short
# Or manually time the core function:
python3 -c "
import time
from allergen_core import check_allergens  # adjust import
start = time.perf_counter()
for _ in range(1000):
    check_allergens({'ingredients': ['milk','wheat','egg']}, user_profile={'allergies': ['peanut']})
elapsed = (time.perf_counter() - start) / 1000 * 1000
print(f'avg: {elapsed:.2f}ms')
"
```

### Confirm determinism
```python
# Same input must always produce same output — no randomness, no model sampling
result_1 = check_allergens(test_input)
result_2 = check_allergens(test_input)
assert result_1 == result_2, "NON-DETERMINISTIC — DO NOT SHIP"
```

### Standard cleanups (do while gated)
- Purge Emergent refs
- Fix CORS
- Document the allergen data source (FALCPA list, EU-14, etc.)
- Add unit test coverage for edge cases: trace amounts, "may contain", cross-contamination

## DoD (architecture only — ship gate stays closed)
- [ ] Core allergen match runs < 100ms on 1000 iterations
- [ ] Determinism confirmed (same input → same output, every time)
- [ ] No Emergent refs
- [ ] CORS clean
- [ ] Liability + insurance gates documented in NOW_AND_LATER.md
- [ ] Ship gate: CLOSED until legal + insurance clear
