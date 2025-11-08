pipeline {
  agent {
    docker {
      image 'docker:24.0-cli'
      args '-v /var/run/docker.sock:/var/run/docker.sock'
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
        sh 'docker build --build-arg ENABLE_GEMINI=${ENABLE_GEMINI_chatbot} --build-arg GEMINI_MODEL=${GEMINI_MODEL_chatbot} -t ${IMAGE_NAME_chatbot}:${IMAGE_TAG_chatbot} .'
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([string(credentialsId: 'gemini-api-key-chatbot', variable: 'GEMINI_API_KEY_chatbot')]) {
          sh '''
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
            ${IMAGE_NAME_chatbot}:${IMAGE_TAG_chatbot}
          '''
        }
      }
    }
  }
}
