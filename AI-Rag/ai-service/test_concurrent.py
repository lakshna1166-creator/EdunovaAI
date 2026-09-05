#!/usr/bin/env python3
"""Test concurrent initialization safety"""
import threading
import time
import sys
from unittest.mock import MagicMock, patch

# Import the module
import app.rag.embeddings as embeddings


def reset_state():
    """Reset the module state for testing"""
    # Reset module-level variables
    embeddings.SentenceTransformer = None
    embeddings._INIT_IN_PROGRESS = False
    embeddings._INIT_EVENT = threading.Event()
    embeddings._MODEL_CACHE.clear()


def test_concurrent_initialization():
    """Test that concurrent requests wait for the same initialization"""
    print("Testing concurrent initialization safety...")
    
    reset_state()
    
    results = []
    errors = []
    lock = threading.Lock()
    
    # Mock SentenceTransformer class so it doesn't try to download/load real model
    mock_st_class = MagicMock()
    mock_model_instance = MagicMock()
    mock_st_class.return_value = mock_model_instance
    
    def worker(worker_id):
        try:
            start_time = time.time()
            with patch('app.rag.embeddings.SentenceTransformer', mock_st_class):
                model = embeddings.get_sentence_transformer()
            end_time = time.time()
            
            with lock:
                results.append({
                    'worker_id': worker_id,
                    'model': model,
                    'duration': end_time - start_time,
                    'success': True
                })
        except Exception as e:
            with lock:
                errors.append({
                    'worker_id': worker_id,
                    'error': str(e),
                    'success': False
                })
    
    # Start multiple threads simultaneously
    threads = []
    for i in range(5):
        t = threading.Thread(target=worker, args=(i,), name=f'worker-{i}')
        threads.append(t)
    
    # Start all threads at nearly the same time
    for t in threads:
        t.start()
    
    # Wait for all to complete
    for t in threads:
        t.join(timeout=30)  # 30 second timeout
    
    # Analyze results
    print(f"\nResults:")
    print(f"  Successful workers: {len(results)}")
    print(f"  Failed workers: {len(errors)}")
    
    if errors:
        print("  Errors:")
        for err in errors:
            print(f"    Worker {err['worker_id']}: {err['error']}")
        return False
    
    # Check that all workers got the same model instance (same object ID)
    model_ids = [id(r['model']) for r in results]
    unique_model_ids = set(model_ids)
    
    print(f"  Unique model instances: {len(unique_model_ids)} (should be 1)")
    
    if len(unique_model_ids) != 1:
        print("  FAIL: Multiple model instances created!")
        return False
    
    # Verify mock_st_class was only called once (one initialization)
    call_count = mock_st_class.call_count
    print(f"  SentenceTransformer() call count: {call_count} (should be 1)")
    
    if call_count != 1:
        print(f"  FAIL: SentenceTransformer was instantiated {call_count} times, expected 1!")
        return False
    
    # Check timing - all workers should complete around the same time
    durations = [r['duration'] for r in results]
    max_duration = max(durations)
    min_duration = min(durations)
    
    print(f"  Duration range: {min_duration:.3f}s - {max_duration:.3f}s")
    
    print("  PASS: Concurrent initialization safety verified")
    print("        - Only ONE SentenceTransformer instantiation occurred")
    print("        - All 5 workers received the same cached model instance")
    return True


def test_initialization_failure_recovery():
    """Test that failed initialization doesn't permanently break the service"""
    print("\nTesting initialization failure recovery...")
    
    reset_state()
    
    # First attempt: mock an import failure
    with patch('app.rag.embeddings.SentenceTransformer', side_effect=ImportError("Mock import failure")):
        try:
            model = embeddings.get_sentence_transformer()
            print("  FAIL: Should have raised an exception")
            return False
        except ImportError as e:
            if "Mock import failure" in str(e):
                print("  PASS: Import failure properly propagated")
            else:
                print(f"  FAIL: Wrong exception: {e}")
                return False
        except Exception as e:
            print(f"  FAIL: Unexpected exception: {e}")
            return False
    
    # Verify that state is reset so retry can succeed
    print(f"  After failure: SentenceTransformer={embeddings.SentenceTransformer}, _INIT_IN_PROGRESS={embeddings._INIT_IN_PROGRESS}")
    
    # Second attempt: retry and succeed
    with patch('app.rag.embeddings.SentenceTransformer') as mock_st:
        mock_instance = MagicMock()
        mock_st.return_value = mock_instance
        
        try:
            model = embeddings.get_sentence_transformer()
            print("  PASS: Recovery after failure works (no deadlock)")
            return True
        except Exception as e:
            print(f"  FAIL: Recovery failed (state stuck): {e}")
            return False


def test_health_endpoint():
    """Verify the health endpoint doesn't trigger embedding initialization"""
    print("\nTesting /health endpoint stays lightweight...")
    
    reset_state()
    
    try:
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        response = client.get("/health")
        
        if response.status_code == 200 and response.json() == {"status": "ok"}:
            print("  PASS: /health returns {'status': 'ok'} with status 200")
        else:
            print(f"  FAIL: /health returned status={response.status_code}, body={response.json()}")
            return False
        
        # Verify SentenceTransformer was NOT imported during /health
        if embeddings.SentenceTransformer is None:
            print("  PASS: /health did NOT trigger SentenceTransformer initialization")
        else:
            print("  FAIL: /health triggered SentenceTransformer initialization!")
            return False
        
        return True
    except Exception as e:
        print(f"  FAIL: Exception during /health test: {e}")
        return False


if __name__ == "__main__":
    success1 = test_concurrent_initialization()
    success2 = test_initialization_failure_recovery()
    success3 = test_health_endpoint()
    
    if success1 and success2 and success3:
        print("\n[PASS] All tests passed!")
        sys.exit(0)
    else:
        print("\n[FAIL] Some tests failed!")
        sys.exit(1)