/**
 * 스트리밍용 모델 폴백. 아직 델타를 하나도 방출하지 않은 상태에서 실패하면
 * 다음 모델로 넘어가지만, 이미 델타를 방출한 뒤 실패하면(클라이언트가 이미
 * 부분 출력을 받은 상태) 폴백하지 않고 에러를 그대로 전파한다.
 */
export async function withModelFallbackStream<T>(
  models: string[],
  attempt: (model: string, onEmit: () => void) => Promise<T>,
): Promise<T> {
  if (models.length === 0) {
    throw new Error('시도할 모델이 없습니다.');
  }

  let lastError: unknown;
  for (const model of models) {
    let emitted = false;
    try {
      return await attempt(model, () => {
        emitted = true;
      });
    } catch (err) {
      lastError = err;
      if (emitted) throw err;
    }
  }
  throw lastError;
}
