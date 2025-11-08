pipeline {
  agent {
    docker {
      image 'docker:24.0-cli'
      args '-v /var/run/docker.sock:/var/run/docker.sock -u 0:0'
      reuseNode true
    }
  }

  environment {
    IMAGE_NAME_chatbot = "${env.IMAGE_NAME_chatbot ?: 'albertpurnawan/chatbot'}"
    IMAGE_TAG_chatbot = "${env.IMAGE_TAG_chatbot ?: env.BUILD_NUMBER}"
    CONTAINER_NAME_chatbot = "${env.CONTAINER_NAME_chatbot ?: 'chatbot'}"
    PORT_HOST_chatbot = "${env.PORT_HOST_chatbot ?: '8787'}"
    PORT_CONTAINER_chatbot = "${env.PORT_CONTAINER_chatbot ?: '8787'}"
    ENABLE_GEMINI_chatbot = "${env.ENABLE_GEMINI_chatbot ?: 'false'}"
    GEMINI_MODEL_chatbot = "${env.GEMINI_MODEL_chatbot ?: 'gemini-2.5-flash'}"
    GEMINI_API_KEY_chatbot = "${env.GEMINI_API_KEY_chatbot ?: ''}"
    MAX_REQUESTS_PER_DAY_chatbot = "${env.MAX_REQUESTS_PER_DAY_chatbot ?: '5'}"
    DATA_DIR_chatbot = "${env.DATA_DIR_chatbot ?: '/var/lib/chatbot/data'}"
  }

  options {
    timestamps()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // Dockerfile builds the frontend; no pre-build steps needed here

    stage('Build Docker image') {
      steps {
        withEnv(["DOCKER_CONFIG=${WORKSPACE}/.docker"]) {
          sh '''
          set -eu
          mkdir -p "$DOCKER_CONFIG"
          IMAGE_REF="$IMAGE_NAME_chatbot"
          case "$IMAGE_REF" in
            *:*) ;;
            *) IMAGE_REF="$IMAGE_REF:$IMAGE_TAG_chatbot" ;;
          esac
          echo "[build] Using image tag: $IMAGE_REF"
          docker build \
            --build-arg ENABLE_GEMINI=${ENABLE_GEMINI_chatbot} \
            --build-arg GEMINI_MODEL=${GEMINI_MODEL_chatbot} \
            -t "$IMAGE_REF" .
          echo "$IMAGE_REF" > image_ref.txt
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        withEnv(["DOCKER_CONFIG=${WORKSPACE}/.docker"]) {
          script {
            def imageRef = "${IMAGE_NAME_chatbot}".trim()
            if (!imageRef.contains(':')) { imageRef = imageRef + ":${IMAGE_TAG_chatbot}" }
            if ((env.ENABLE_GEMINI_chatbot ?: 'false').toBoolean()) {
              withCredentials([string(credentialsId: 'GEMINI_API_KEY_chatbot', variable: 'GEMINI_API_KEY_chatbot')]) {
                sh """
                  set -eu
                  mkdir -p "$DOCKER_CONFIG"
                  echo "[deploy] Using image tag: ${imageRef}"
                  docker rm -f ${CONTAINER_NAME_chatbot} || true
                  docker run -d \
                    --name ${CONTAINER_NAME_chatbot} \
                    -p ${PORT_HOST_chatbot}:${PORT_CONTAINER_chatbot} \
                    -e PORT=${PORT_CONTAINER_chatbot} \
                    -e MAX_REQUESTS_PER_DAY=${MAX_REQUESTS_PER_DAY_chatbot} \
                    -e ENABLE_GEMINI=${ENABLE_GEMINI_chatbot} \
                    -e GEMINI_MODEL=${GEMINI_MODEL_chatbot} \
                    -e GEMINI_API_KEY=${GEMINI_API_KEY_chatbot} \
                    -v ${DATA_DIR_chatbot}:/app/data \
                    "${imageRef}"
                """
              }
            } else {
              sh """
                set -eu
                mkdir -p "$DOCKER_CONFIG"
                echo "[deploy] Using image tag: ${imageRef}"
                docker rm -f ${CONTAINER_NAME_chatbot} || true
                docker run -d \
                  --name ${CONTAINER_NAME_chatbot} \
                  -p ${PORT_HOST_chatbot}:${PORT_CONTAINER_chatbot} \
                  -e PORT=${PORT_CONTAINER_chatbot} \
                  -e MAX_REQUESTS_PER_DAY=${MAX_REQUESTS_PER_DAY_chatbot} \
                  -e ENABLE_GEMINI=${ENABLE_GEMINI_chatbot} \
                  -e GEMINI_MODEL=${GEMINI_MODEL_chatbot} \
                  -v ${DATA_DIR_chatbot}:/app/data \
                  "${imageRef}"
              """
            }
          }
        }
      }
    }
  }
}
