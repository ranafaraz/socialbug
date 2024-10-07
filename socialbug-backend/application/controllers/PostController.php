<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class PostController extends CI_Controller {

	public function __construct() {
		parent::__construct();
		$this->load->model('PostModel');
		$this->load->helper('url');
	}

	// Display all posts
	public function index() {
		$data['posts'] = $this->PostModel->getAllPosts();
		$this->load->view('post_view', $data);
	}

	// Create new post
	public function create() {
		if ($this->input->post()) {
			$postData = array(
				'title' => $this->input->post('title'),
				'content' => $this->input->post('content'),
				'media_url' => $this->upload_media()
			);
			$this->PostModel->insertPost($postData);
			redirect('PostController');
		} else {
			$this->load->view('create_post_view');
		}
	}

	// Edit a post
	public function edit($id) {
		if ($this->input->post()) {
			$postData = array(
				'title' => $this->input->post('title'),
				'content' => $this->input->post('content')
			);
			if (!empty($_FILES['media']['name'])) {
				$postData['media_url'] = $this->upload_media();
			}
			$this->PostModel->updatePost($id, $postData);
			redirect('PostController');
		} else {
			$data['post'] = $this->PostModel->getPostById($id);
			$this->load->view('edit_post_view', $data);
		}
	}

	// Delete a post
	public function delete($id) {
		$this->PostModel->deletePost($id);
		redirect('PostController');
	}

	// Media upload handling
	private function upload_media() {
		$config['upload_path'] = './uploads/';
		$config['allowed_types'] = 'gif|jpg|png|mp4';
		$this->load->library('upload', $config);

		if ($this->upload->do_upload('media')) {
			$uploadData = $this->upload->data();
			return base_url('uploads/' . $uploadData['file_name']);
		}
		return '';
	}
}
